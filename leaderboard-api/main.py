"""
External Leaderboard and Admin API Service
Handles access codes, game sessions, scoring, and leaderboards
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from elasticsearch import AsyncElasticsearch
import asyncio
import logging
import uuid
import os
import secrets
import string
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "")

# Pydantic Models
class AccessCodeValidation(BaseModel):
    access_code: str
    player_name: str
    player_email: str
    company: Optional[str] = None

class AccessCodeResponse(BaseModel):
    valid: bool
    session_id: str
    expires_at: datetime
    message: str

class GameSession(BaseModel):
    session_id: str
    access_code: str
    player_name: str
    player_email: str
    company: Optional[str] = None
    selected_agent: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    game_duration: Optional[int] = None  # seconds
    items_selected: List[Dict[str, Any]] = []
    total_price: Optional[float] = None
    target_price: float = 100.0
    score: Optional[float] = None
    completed: bool = False
    created_date: datetime = Field(default_factory=datetime.utcnow)
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class GameSubmission(BaseModel):
    session_id: str
    selected_agent: str
    items_selected: List[Dict[str, Any]]
    total_price: float
    game_duration: int  # seconds

class LeaderboardEntry(BaseModel):
    rank: int
    player_name: str
    company: Optional[str] = None
    selected_agent: str
    total_price: float
    score: float
    game_duration: int
    completed_at: datetime

class AccessCodeGeneration(BaseModel):
    count: int = Field(ge=1, le=1000)
    expires_at: Optional[datetime] = None
    batch_name: Optional[str] = None

class AdminSettings(BaseModel):
    target_price: float = 100.0
    game_duration_minutes: int = 5
    current_season: str = "fall"
    leaderboard_reset_threshold: int = 100


class LeaderboardService:
    """Service for managing leaderboards and game sessions"""
    
    def __init__(self, es_client: AsyncElasticsearch):
        self.es = es_client
        self.current_leaderboard_suffix = self._get_current_date_suffix()
        
    def _get_current_date_suffix(self) -> str:
        """Get current date suffix for leaderboard index"""
        return datetime.utcnow().strftime("%Y%m%d_%03d")  # YYYYMMDD_001
        
    async def create_indices(self):
        """Create necessary Elasticsearch indices"""
        indices = {
            "access_codes": {
                "mappings": {
                    "properties": {
                        "access_code": {"type": "keyword"},
                        "active": {"type": "boolean"},
                        "used": {"type": "boolean"},
                        "used_by": {"type": "keyword"},
                        "used_at": {"type": "date"},
                        "expires_at": {"type": "date"},
                        "batch_name": {"type": "keyword"},
                        "created_at": {"type": "date"}
                    }
                }
            },
            "game_sessions": {
                "mappings": {
                    "properties": {
                        "session_id": {"type": "keyword"},
                        "access_code": {"type": "keyword"},
                        "player_name": {"type": "text"},
                        "player_email": {"type": "keyword"},
                        "company": {"type": "text"},
                        "selected_agent": {"type": "keyword"},
                        "start_time": {"type": "date"},
                        "end_time": {"type": "date"},
                        "game_duration": {"type": "integer"},
                        "items_selected": {
                            "type": "nested",
                            "properties": {
                                "item_id": {"type": "keyword"},
                                "item_name": {"type": "text"},
                                "store_id": {"type": "keyword"},
                                "price": {"type": "double"},
                                "quantity": {"type": "integer"}
                            }
                        },
                        "total_price": {"type": "double"},
                        "target_price": {"type": "double"},
                        "score": {"type": "double"},
                        "completed": {"type": "boolean"},
                        "created_date": {"type": "date"},
                        "last_updated": {"type": "date"}
                    }
                }
            },
            "admin_settings": {
                "mappings": {
                    "properties": {
                        "target_price": {"type": "double"},
                        "game_duration_minutes": {"type": "integer"},
                        "current_season": {"type": "keyword"},
                        "leaderboard_reset_threshold": {"type": "integer"},
                        "last_updated": {"type": "date"}
                    }
                }
            }
        }
        
        for index_name, mapping in indices.items():
            try:
                exists = await self.es.indices.exists(index=index_name)
                if not exists:
                    await self.es.indices.create(index=index_name, body=mapping)
                    logger.info(f"Created index: {index_name}")
            except Exception as e:
                logger.error(f"Error creating index {index_name}: {e}")
                
    async def generate_access_codes(self, count: int, expires_at: Optional[datetime] = None, batch_name: Optional[str] = None) -> List[str]:
        """Generate new access codes"""
        if expires_at is None:
            expires_at = datetime.utcnow() + timedelta(days=7)  # Default 7 days
            
        if batch_name is None:
            batch_name = f"batch_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            
        codes = []
        for _ in range(count):
            # Generate 6-character code
            code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
            
            # Avoid confusing characters
            code = code.replace('0', '2').replace('O', 'P').replace('I', 'J').replace('1', '7')
            
            access_code_doc = {
                "access_code": code,
                "active": True,
                "used": False,
                "used_by": None,
                "used_at": None,
                "expires_at": expires_at,
                "batch_name": batch_name,
                "created_at": datetime.utcnow()
            }
            
            try:
                await self.es.index(
                    index="access_codes",
                    id=code,
                    document=access_code_doc,
                    refresh="wait_for"
                )
                codes.append(code)
                
            except Exception as e:
                logger.error(f"Failed to create access code {code}: {e}")
                
        logger.info(f"Generated {len(codes)} access codes in batch {batch_name}")
        return codes
        
    async def validate_access_code(self, code: str, player_name: str, player_email: str, company: Optional[str] = None) -> AccessCodeResponse:
        """Validate an access code and create game session"""
        try:
            # Check if code exists and is valid
            response = await self.es.get(index="access_codes", id=code)
            code_doc = response["_source"]
            
            if not code_doc.get("active", False):
                return AccessCodeResponse(
                    valid=False,
                    session_id="",
                    expires_at=datetime.utcnow(),
                    message="Access code is not active"
                )
                
            if code_doc.get("used", False):
                return AccessCodeResponse(
                    valid=False,
                    session_id="",
                    expires_at=datetime.utcnow(),
                    message="Access code has already been used"
                )
                
            expires_at = datetime.fromisoformat(code_doc["expires_at"].replace('Z', '+00:00'))
            if expires_at < datetime.utcnow().replace(tzinfo=expires_at.tzinfo):
                return AccessCodeResponse(
                    valid=False,
                    session_id="",
                    expires_at=expires_at,
                    message="Access code has expired"
                )
                
            # Mark code as used
            await self.es.update(
                index="access_codes",
                id=code,
                body={
                    "doc": {
                        "used": True,
                        "used_by": player_email,
                        "used_at": datetime.utcnow()
                    }
                },
                refresh="wait_for"
            )
            
            # Create game session
            session_id = str(uuid.uuid4())
            session = GameSession(
                session_id=session_id,
                access_code=code,
                player_name=player_name,
                player_email=player_email,
                company=company
            )
            
            await self.es.index(
                index="game_sessions",
                id=session_id,
                document=session.dict(),
                refresh="wait_for"
            )
            
            return AccessCodeResponse(
                valid=True,
                session_id=session_id,
                expires_at=expires_at,
                message="Access code validated successfully"
            )
            
        except Exception as e:
            logger.error(f"Error validating access code {code}: {e}")
            return AccessCodeResponse(
                valid=False,
                session_id="",
                expires_at=datetime.utcnow(),
                message="Error validating access code"
            )
            
    async def submit_game_result(self, submission: GameSubmission) -> Dict[str, Any]:
        """Submit game result and calculate score"""
        try:
            # Get current session
            session_response = await self.es.get(index="game_sessions", id=submission.session_id)
            session_doc = session_response["_source"]
            
            # Get current settings
            settings = await self.get_admin_settings()
            target_price = settings.target_price
            
            # Calculate score
            score = self._calculate_score(
                submission.total_price,
                target_price,
                submission.game_duration,
                settings.game_duration_minutes * 60  # Convert to seconds
            )
            
            # Update session with results
            update_doc = {
                "selected_agent": submission.selected_agent,
                "items_selected": submission.items_selected,
                "total_price": submission.total_price,
                "target_price": target_price,
                "score": score,
                "game_duration": submission.game_duration,
                "end_time": datetime.utcnow(),
                "completed": True,
                "last_updated": datetime.utcnow()
            }
            
            await self.es.update(
                index="game_sessions",
                id=submission.session_id,
                body={"doc": update_doc},
                refresh="wait_for"
            )
            
            # Add to current leaderboard
            leaderboard_entry = {
                "session_id": submission.session_id,
                "player_name": session_doc["player_name"],
                "player_email": session_doc["player_email"],
                "company": session_doc.get("company"),
                "selected_agent": submission.selected_agent,
                "total_price": submission.total_price,
                "score": score,
                "game_duration": submission.game_duration,
                "completed_at": datetime.utcnow(),
                "leaderboard_date": self.current_leaderboard_suffix
            }
            
            leaderboard_index = f"leaderboard_{self.current_leaderboard_suffix}"
            await self.es.index(
                index=leaderboard_index,
                document=leaderboard_entry,
                refresh="wait_for"
            )
            
            logger.info(f"Game result submitted for session {submission.session_id}, score: {score}")
            
            return {
                "score": score,
                "total_price": submission.total_price,
                "target_price": target_price,
                "rank": await self._get_current_rank(leaderboard_index, score)
            }
            
        except Exception as e:
            logger.error(f"Error submitting game result: {e}")
            raise HTTPException(status_code=500, detail="Failed to submit game result")
            
    def _calculate_score(self, total_price: float, target_price: float, time_taken: int, time_limit: int) -> float:
        """Calculate game score based on price accuracy and speed"""
        # Closeness score (0-70 points)
        if total_price <= target_price:
            price_accuracy = (1 - abs(target_price - total_price) / target_price) * 70
        else:
            price_accuracy = 0  # Over budget = 0 points
            
        # Speed score (0-30 points)
        if time_taken <= time_limit:
            speed_score = (1 - time_taken / time_limit) * 30
        else:
            speed_score = 0  # Over time = 0 speed points
            
        total_score = price_accuracy + speed_score
        return round(total_score, 2)
        
    async def _get_current_rank(self, leaderboard_index: str, score: float) -> int:
        """Get current rank for a score"""
        try:
            response = await self.es.search(
                index=leaderboard_index,
                body={
                    "query": {"range": {"score": {"gt": score}}},
                    "size": 0
                }
            )
            return response["hits"]["total"]["value"] + 1
        except:
            return 1
            
    async def get_leaderboard(self, limit: int = 10, date_suffix: Optional[str] = None) -> List[LeaderboardEntry]:
        """Get current leaderboard"""
        if date_suffix is None:
            date_suffix = self.current_leaderboard_suffix
            
        leaderboard_index = f"leaderboard_{date_suffix}"
        
        try:
            response = await self.es.search(
                index=leaderboard_index,
                body={
                    "query": {"match_all": {}},
                    "sort": [{"score": {"order": "desc"}}],
                    "size": limit
                }
            )
            
            entries = []
            for i, hit in enumerate(response["hits"]["hits"]):
                source = hit["_source"]
                entry = LeaderboardEntry(
                    rank=i + 1,
                    player_name=source["player_name"],
                    company=source.get("company"),
                    selected_agent=source["selected_agent"],
                    total_price=source["total_price"],
                    score=source["score"],
                    game_duration=source["game_duration"],
                    completed_at=datetime.fromisoformat(source["completed_at"].replace('Z', '+00:00'))
                )
                entries.append(entry)
                
            return entries
            
        except Exception as e:
            logger.error(f"Error getting leaderboard: {e}")
            return []
            
    async def get_admin_settings(self) -> AdminSettings:
        """Get admin settings"""
        try:
            response = await self.es.get(index="admin_settings", id="current")
            return AdminSettings(**response["_source"])
        except:
            # Return defaults if not found
            settings = AdminSettings()
            await self.update_admin_settings(settings)
            return settings
            
    async def update_admin_settings(self, settings: AdminSettings):
        """Update admin settings"""
        settings_doc = settings.dict()
        settings_doc["last_updated"] = datetime.utcnow()
        
        await self.es.index(
            index="admin_settings",
            id="current",
            document=settings_doc,
            refresh="wait_for"
        )
        
    async def roll_leaderboard(self) -> str:
        """Create new leaderboard for the day"""
        # Find next available suffix for today
        base_date = datetime.utcnow().strftime("%Y%m%d")
        counter = 1
        
        while True:
            new_suffix = f"{base_date}_{counter:03d}"
            leaderboard_index = f"leaderboard_{new_suffix}"
            
            exists = await self.es.indices.exists(index=leaderboard_index)
            if not exists:
                self.current_leaderboard_suffix = new_suffix
                logger.info(f"Rolled leaderboard to: {leaderboard_index}")
                return new_suffix
                
            counter += 1
            if counter > 999:  # Safety check
                raise Exception("Too many leaderboard rolls for today")


# FastAPI App
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    es_url = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
    es_api_key = os.getenv("ELASTICSEARCH_API_KEY", "")
    
    global es_client, leaderboard_service
    
    es_client = AsyncElasticsearch(
        hosts=[es_url],
        api_key=es_api_key,
        verify_certs=True
    )
    
    leaderboard_service = LeaderboardService(es_client)
    await leaderboard_service.create_indices()
    
    logger.info("Leaderboard service started")
    
    yield
    
    # Shutdown
    await es_client.close()
    logger.info("Leaderboard service stopped")

app = FastAPI(
    title="The Price is Bot 🤖 - Leaderboard API",
    description="External API for access codes, game sessions, and leaderboards",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables (set in lifespan)
es_client: AsyncElasticsearch = None
leaderboard_service: LeaderboardService = None


# API Endpoints
@app.post("/api/validate-code", response_model=AccessCodeResponse)
async def validate_access_code(validation: AccessCodeValidation):
    """Validate an access code and create game session"""
    return await leaderboard_service.validate_access_code(
        validation.access_code,
        validation.player_name,
        validation.player_email,
        validation.company
    )

@app.post("/api/submit-game")
async def submit_game_result(submission: GameSubmission):
    """Submit game result and get score"""
    return await leaderboard_service.submit_game_result(submission)

@app.get("/api/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(limit: int = 10, date: Optional[str] = None):
    """Get leaderboard entries"""
    return await leaderboard_service.get_leaderboard(limit, date)

@app.get("/api/settings", response_model=AdminSettings)
async def get_settings():
    """Get current admin settings"""
    return await leaderboard_service.get_admin_settings()

# Admin endpoints (require authentication in production)
@app.post("/admin/generate-codes")
async def generate_access_codes(generation: AccessCodeGeneration, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Generate new access codes (Admin only)"""
    if not ADMIN_TOKEN or credentials.credentials != ADMIN_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    codes = await leaderboard_service.generate_access_codes(
        generation.count, 
        generation.expires_at,
        generation.batch_name
    )
    return {"codes": codes, "count": len(codes)}

@app.post("/admin/settings")
async def update_settings(settings: AdminSettings, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Update admin settings (Admin only)"""
    if not ADMIN_TOKEN or credentials.credentials != ADMIN_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    await leaderboard_service.update_admin_settings(settings)
    return {"message": "Settings updated successfully"}

@app.post("/admin/roll-leaderboard")
async def roll_leaderboard(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Create new leaderboard for the day (Admin only)"""
    if not ADMIN_TOKEN or credentials.credentials != ADMIN_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    new_suffix = await leaderboard_service.roll_leaderboard()
    return {"message": f"Leaderboard rolled to: {new_suffix}"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.get("/")
async def root():
    return {"service": "price-is-bot-leaderboard-api", "status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
