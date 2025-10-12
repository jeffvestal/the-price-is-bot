# The Price is Bot - Game UI

A modern, reactive web application built with Next.js 14 that provides an engaging AI-powered grocery shopping challenge experience.

## Features

✨ **Modern UI/UX**
- Next.js 14 with App Router
- Framer Motion animations
- Tailwind CSS with custom Vegas & Elastic theming
- Responsive design for all devices

🤖 **AI Agent Integration**  
- 5 unique shopping agents with distinct personalities
- Real-time chat interface with Agent Builder APIs
- Dynamic item suggestions and cart building

🎮 **Engaging Game Experience**
- Timed shopping challenges (configurable duration)
- Real-time scoring system
- Interactive shopping cart with budget tracking
- Confetti celebrations and smooth transitions

🏆 **Leaderboard System**
- Live leaderboard with automatic updates
- Company and agent tracking
- Historical score preservation

🔐 **Access Control**
- Secure access code validation
- Session management with Zustand
- Admin panel for code generation

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Environment Variables

```bash
# API URLs
NEXT_PUBLIC_LEADERBOARD_API_URL=http://localhost:8080
NEXT_PUBLIC_AGENT_BUILDER_URL=http://localhost:5601

# Game Configuration  
NEXT_PUBLIC_TARGET_PRICE=100
NEXT_PUBLIC_GAME_DURATION=300
```

## Architecture

### State Management
- **Zustand** for global game state
- Persistent session management
- Reactive updates across components

### Component Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Main game interface
│   ├── admin/             # Admin dashboard
│   └── layout.tsx         # Root layout with metadata
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── AgentChatInterface.tsx
│   ├── ShoppingCart.tsx
│   ├── GameTimer.tsx
│   ├── LeaderboardDisplay.tsx
│   └── AdminPanel.tsx
└── store/                # Zustand stores
    └── gameStore.ts      # Main game state
```

### Key Components

#### **AgentChatInterface**
- Real-time chat with AI shopping agents
- Message history and typing indicators
- Item suggestion integration

#### **ShoppingCart** 
- Dynamic cart management
- Budget progress tracking
- Quantity controls and item removal

#### **GameTimer**
- Configurable countdown timer
- Visual progress indicators
- Pause/resume functionality

#### **LeaderboardDisplay**
- Live score updates
- Animated rank transitions
- Company and agent badges

### Styling

**Tailwind CSS** with custom configurations:
- Vegas-themed color palette (`vegas-gold`, `vegas-red`)
- Elastic brand colors (`elastic-blue`, `elastic-teal`)
- Custom animations and transitions
- Responsive breakpoints

**Key Design Principles:**
- Mobile-first responsive design
- Smooth micro-interactions
- Accessible color contrasts
- Consistent spacing and typography

## Game Flow

1. **Authentication** - Access code validation
2. **Agent Selection** - Choose AI shopping assistant
3. **Game Rules** - Interactive rules explanation
4. **Shopping Phase** - Timed cart building with AI agent
5. **Completion** - Score calculation and leaderboard

## Agent Types

Each agent has unique tools and personality:

- **💰 Budget Master** - Price optimization and deals
- **🥗 Health Guru** - Nutrition and dietary restrictions  
- **👨‍🍳 Gourmet Chef** - Recipe combinations and premium ingredients
- **⚡ Speed Shopper** - Quick decisions and popular items
- **🎰 Vegas Local Expert** - Local store knowledge and specialties

## API Integration

### Agent Builder APIs
```typescript
// Chat with selected agent
POST /api/agent_builder/converse
{
  "agent_id": "budget_master_session123",
  "message": "Find me healthy breakfast items under $20"
}
```

### Leaderboard APIs
```typescript
// Submit game result
POST /api/submit-game
{
  "session_id": "session123",
  "selected_agent": "budget_master",
  "items_selected": [...],
  "total_price": 99.87,
  "game_duration": 142
}
```

## Development

### Building for Production

```bash
npm run build
npm start
```

### Key Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint checking
```

### Adding New Features

1. **New Agent Type**: Add to `MOCK_AGENTS` in `gameStore.ts`
2. **UI Components**: Follow existing patterns in `/components`
3. **Styling**: Use Tailwind classes with custom theme
4. **State**: Extend Zustand store as needed

## Deployment

The application is designed to work with:
- **Instruqt** for containerized demo environments
- **Vercel/Netlify** for standalone deployments
- **Docker** for self-hosted environments

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Performance

- **Lazy loading** for modal components
- **Optimized images** with Next.js Image component
- **Minimal bundle size** with tree shaking
- **Fast refresh** during development

## Accessibility

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance

## License

MIT License - see LICENSE file for details.

## Support

For support and questions, contact the Elastic team or create an issue in the repository.
