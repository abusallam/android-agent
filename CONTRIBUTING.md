# Contributing to Family Safety Monitor

Thank you for your interest in contributing to the Family Safety Monitor! This project is designed to help families monitor disabled family members for their safety and wellbeing.

## 🎯 Project Mission

This project provides a modern, secure, and accessible Progressive Web App (PWA) for family safety monitoring, specifically designed for families with disabled members who need continuous monitoring for their safety.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (optional, for full stack deployment)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/family-safety-monitor.git
   cd family-safety-monitor
   ```

2. **Install dependencies**
   ```bash
   cd modern-dashboard
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open http://localhost:3000 in your browser
   - For mobile testing, use your computer's IP address

## 🏗️ Project Structure

```
family-safety-monitor/
├── modern-dashboard/          # Next.js PWA application
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   ├── components/       # React components
│   │   ├── lib/              # Utility libraries
│   │   └── i18n/             # Internationalization
│   ├── public/               # Static assets
│   ├── prisma/               # Database schema
│   └── messages/             # Translation files
├── ssl/                      # SSL certificates for HTTPS
├── docker-compose.yml        # Multi-service setup
└── docs/                     # Documentation
```

## 🛠️ Development Guidelines

### Code Style

- **TypeScript**: All new code should be written in TypeScript
- **ESLint**: Follow the existing ESLint configuration
- **Prettier**: Code formatting is handled automatically
- **Components**: Use functional components with hooks

### Naming Conventions

- **Files**: kebab-case for files (`device-status-card.tsx`)
- **Components**: PascalCase (`DeviceStatusCard`)
- **Functions**: camelCase (`getUserLocation`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)

### Component Guidelines

```typescript
// Good component structure
'use client';

import { useState, useEffect } from 'react';
import { SomeIcon } from 'lucide-react';

interface ComponentProps {
  prop1: string;
  prop2?: number;
}

export default function ComponentName({ prop1, prop2 = 0 }: ComponentProps) {
  const [state, setState] = useState<StateType>(initialValue);

  useEffect(() => {
    // Effect logic
  }, []);

  return (
    <div className="component-container">
      {/* Component JSX */}
    </div>
  );
}
```

## 🧪 Testing

### Running Tests

```bash
# Run feature tests
node test-enhanced-features.js

# Run Next.js build test
npm run build

# Run linting
npm run lint
```

### Testing Guidelines

- Test all API endpoints
- Verify PWA functionality
- Test emergency alert system
- Validate real-time updates
- Check mobile responsiveness

## 📱 PWA Development

### PWA Requirements

- **Manifest**: Properly configured PWA manifest
- **Service Worker**: Background processing and offline support
- **Installable**: Add to home screen functionality
- **Responsive**: Mobile-first design
- **Accessible**: WCAG compliance

### Testing PWA Features

1. **Install PWA on mobile device**
2. **Test offline functionality**
3. **Verify push notifications**
4. **Test auto-start capability**
5. **Check background monitoring**

## 🚨 Emergency System

### Emergency Alert Types

- **Panic Button**: Manual emergency activation
- **Low Battery**: Automatic low battery alerts
- **Location Lost**: GPS signal loss alerts
- **No Movement**: Inactivity detection
- **Custom Alerts**: User-defined emergency conditions

### Adding New Alert Types

1. Update `EmergencyAlert` interface
2. Add alert logic in `emergency-panel.tsx`
3. Update API endpoints
4. Add notification handling
5. Test thoroughly

## 🌍 Internationalization

### Adding New Languages

1. Create translation file in `messages/`
2. Add language to `i18n/request.ts`
3. Update language switcher
4. Test RTL support if applicable

### Translation Guidelines

- Use descriptive keys
- Keep translations concise
- Consider cultural context
- Test with actual native speakers

## 🔒 Security Guidelines

### Security Best Practices

- **Authentication**: Implement proper user authentication
- **Input Validation**: Validate all user inputs
- **HTTPS**: Always use HTTPS in production
- **Data Encryption**: Encrypt sensitive data
- **Access Control**: Implement role-based permissions

### Reporting Security Issues

Please report security vulnerabilities privately to the maintainers. Do not create public issues for security problems.

## 📊 Performance Guidelines

### Performance Best Practices

- **Code Splitting**: Use dynamic imports for large components
- **Image Optimization**: Use Next.js Image component
- **Caching**: Implement proper caching strategies
- **Bundle Size**: Monitor and optimize bundle size
- **Real-time Updates**: Optimize WebSocket usage

## 🎨 UI/UX Guidelines

### Design Principles

- **Accessibility First**: Design for users with disabilities
- **Mobile First**: Prioritize mobile experience
- **Clear Navigation**: Intuitive user interface
- **Emergency Focus**: Quick access to emergency features
- **Family Friendly**: Appropriate for all family members

### Color Scheme

- **Primary**: Red (#dc2626) - Emergency/Safety theme
- **Success**: Green (#10b981) - Online/Active states
- **Warning**: Yellow (#f59e0b) - Alerts/Warnings
- **Info**: Blue (#2563eb) - Information/Navigation

## 🚀 Deployment

### Production Deployment

```bash
# Docker deployment (recommended)
docker-compose up -d

# Manual deployment
npm run build
npm run start
```

### Environment Configuration

- Set proper environment variables
- Configure database connections
- Set up SSL certificates
- Configure push notification keys

## 📝 Documentation

### Documentation Standards

- **README**: Keep README up to date
- **API Docs**: Document all API endpoints
- **Component Docs**: Document component props and usage
- **Deployment**: Maintain deployment instructions

## 🤝 Pull Request Process

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### PR Guidelines

- **Description**: Provide clear description of changes
- **Testing**: Include test results
- **Screenshots**: Add screenshots for UI changes
- **Breaking Changes**: Document any breaking changes
- **Documentation**: Update documentation if needed

## 🐛 Bug Reports

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior.

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. iOS, Android, Windows]
- Browser: [e.g. chrome, safari]
- Version: [e.g. 22]

**Additional context**
Any other context about the problem.
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Email**: For security issues and private matters

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Family Safety Monitor!** 

Your contributions help make technology more accessible and helpful for families caring for disabled loved ones. 💙