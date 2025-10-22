#!/bin/bash

# The Price is Bot Project Setup Script
# Sets up a unified virtual environment for the entire project

set -e  # Exit on any error

echo "🤖 Setting up The Price is Bot Project Environment..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python 3.8+ is available
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is required but not found. Please install Python 3.8 or higher."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
print_status "Found Python $PYTHON_VERSION"

# Check minimum Python version (3.8)
if python3 -c 'import sys; exit(0 if sys.version_info >= (3, 8) else 1)'; then
    print_success "Python version is compatible"
else
    print_error "Python 3.8 or higher is required. Found: $PYTHON_VERSION"
    exit 1
fi

# Create project-wide virtual environment
VENV_DIR="venv"
if [ ! -d "$VENV_DIR" ]; then
    print_status "Creating project virtual environment..."
    python3 -m venv "$VENV_DIR"
    print_success "Virtual environment created at ./$VENV_DIR"
else
    print_status "Virtual environment already exists at ./$VENV_DIR"
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# Upgrade pip
print_status "Upgrading pip..."
pip install --upgrade pip > /dev/null 2>&1

# Install unified requirements
print_status "Installing project dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    print_success "Python dependencies installed"
else
    print_error "requirements.txt not found!"
    exit 1
fi

# Install Node.js dependencies for game UI
echo ""
print_status "Setting up Game UI (Node.js)..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Found Node.js $NODE_VERSION"
    
    if [ -d "game-ui" ]; then
        cd game-ui
        if [ -f "package.json" ]; then
            print_status "Installing Node.js dependencies..."
            npm install
            print_success "Node.js dependencies installed"
        else
            print_warning "No package.json found in game-ui/"
        fi
        cd ..
    else
        print_warning "game-ui directory not found"
    fi
else
    print_warning "Node.js not found. Skipping frontend setup."
    print_warning "Install Node.js 18+ to set up the game UI"
fi

# Remove old individual virtual environments
echo ""
print_status "Cleaning up old virtual environments..."
for component in "grocery-data-generator" "agent-builder-service" "leaderboard-api" "backend"; do
    if [ -d "$component/venv" ]; then
        print_status "Removing old venv from $component/"
        rm -rf "$component/venv"
        print_success "Removed $component/venv"
    fi
done

# Update convenience scripts to use unified venv
print_status "Creating convenience scripts..."

cat > "run-data-generator.sh" << 'EOF'
#!/bin/bash
# Run grocery data generator using unified venv
source venv/bin/activate
cd grocery-data-generator
python control.py "$@"
EOF
chmod +x "run-data-generator.sh"

cat > "run-leaderboard-api.sh" << 'EOF'
#!/bin/bash  
# Run leaderboard API using unified venv
source venv/bin/activate
cd leaderboard-api
uvicorn main:app --reload "$@"
EOF
chmod +x "run-leaderboard-api.sh"

cat > "run-agent-builder.sh" << 'EOF'
#!/bin/bash
# Run Agent Builder client using unified venv
source venv/bin/activate
cd agent-builder-service
python agent_builder_client.py "$@"
EOF
chmod +x "run-agent-builder.sh"

if command -v node &> /dev/null; then
    cat > "run-game-ui.sh" << 'EOF'
#!/bin/bash
# Run game UI (Node.js)
cd game-ui
npm run dev "$@"
EOF
    chmod +x "run-game-ui.sh"
fi

print_success "Convenience scripts created!"

echo ""
echo "🎉 Setup Complete!"
echo "=================================================="
print_success "Unified virtual environment created!"
echo ""
echo "📁 Project structure:"
echo "   📦 Virtual environment: ./venv (unified for all Python components)"
echo "   🛒 Grocery data generator: ./grocery-data-generator/"
echo "   🤖 Agent Builder service: ./agent-builder-service/"  
echo "   📊 Leaderboard API: ./leaderboard-api/"
echo "   🎮 Game UI: ./game-ui/"
echo "   🏛️  Backend (legacy): ./backend/"
echo ""
echo "🚀 Quick Start Guide:"
echo "--------------------"
echo ""
echo "1. Activate the virtual environment:"
echo "   source venv/bin/activate"
echo ""
echo "2. Run components using convenience scripts:"
echo "   ./run-data-generator.sh --help"
echo "   ./run-leaderboard-api.sh"
echo "   ./run-agent-builder.sh"
if command -v node &> /dev/null; then
echo "   ./run-game-ui.sh"
fi
echo ""
echo "3. Or run components manually:"
echo "   # Generate grocery data"
echo "   source venv/bin/activate && cd grocery-data-generator && python control.py"
echo ""
echo "   # Test Agent Builder"
echo "   source venv/bin/activate && cd agent-builder-service && python agent_builder_client.py"
echo ""
echo "   # Start leaderboard API"
echo "   source venv/bin/activate && cd leaderboard-api && uvicorn main:app --reload"
echo ""
if command -v node &> /dev/null; then
echo "   # Start game UI"
echo "   cd game-ui && npm run dev"
echo ""
fi
echo "🔧 Environment Variables:"
echo "------------------------"
echo ""
echo "For AWS Bedrock (recommended):"
echo "  export AWS_ACCESS_KEY_ID=your_access_key"  
echo "  export AWS_SECRET_ACCESS_KEY=your_secret_key"
echo "  export AWS_DEFAULT_REGION=us-east-1"
echo ""
echo "For Elasticsearch:"
echo "  export ELASTICSEARCH_URL=https://your-cluster.es.cloud.es.io:443"
echo "  export ELASTICSEARCH_API_KEY=your_api_key"
echo ""
echo "For Agent Builder:"
echo "  export KIBANA_URL=https://your-kibana.kb.cloud.es.io"
echo "  export KIBANA_API_KEY=your_kibana_api_key"
echo ""
print_success "💡 All components now use the same virtual environment!"
print_success "🎯 No more switching between different venvs!"

# Activate the virtual environment for immediate use
echo ""
print_status "Activating unified virtual environment..."
source venv/bin/activate

echo ""
print_success "✅ Virtual environment is now active!"
echo "💡 You can now run any component without switching environments"
echo "🔄 To deactivate, run: deactivate"