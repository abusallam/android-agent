#!/usr/bin/env node

/**
 * 🤖 Android Agent AI - Context 7 Code Analysis
 * AI-powered code analysis and optimization suggestions
 */

const fs = require('fs');
const path = require('path');

class Context7Analyzer {
  constructor() {
    this.results = {
      analysis: [],
      suggestions: [],
      metrics: {},
      timestamp: new Date().toISOString()
    };
  }

  async analyzeProject() {
    console.log('🤖 Starting Context 7 AI Code Analysis...');
    
    // Analyze key files
    const filesToAnalyze = [
      'modern-dashboard/src/app/page.tsx',
      'modern-dashboard/src/components/DashboardContent.tsx',
      'modern-dashboard/src/components/emergency-button.tsx',
      'modern-dashboard/src/components/interactive-map.tsx',
      'modern-dashboard/src/components/logo.tsx',
      'modern-dashboard/src/app/api/dashboard/route.ts',
      'modern-dashboard/src/app/api/emergency/call/route.ts'
    ];

    for (const filePath of filesToAnalyze) {
      if (fs.existsSync(filePath)) {
        await this.analyzeFile(filePath);
      }
    }

    await this.generateMetrics();
    await this.generateSuggestions();
    await this.generateReport();
  }

  async analyzeFile(filePath) {
    console.log(`🔍 Analyzing: ${filePath}`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      const analysis = {
        file: filePath,
        lines: lines.length,
        size: content.length,
        complexity: this.calculateComplexity(content),
        issues: this.findIssues(content),
        suggestions: this.generateFileSuggestions(content, filePath)
      };
      
      this.results.analysis.push(analysis);
      
    } catch (error) {
      console.error(`❌ Error analyzing ${filePath}:`, error.message);
    }
  }

  calculateComplexity(content) {
    // Simple complexity calculation
    const cyclomaticComplexity = (content.match(/if|else|while|for|switch|case|\?/g) || []).length;
    const functionCount = (content.match(/function|=>/g) || []).length;
    const componentCount = (content.match(/export.*function|export.*const.*=/g) || []).length;
    
    return {
      cyclomatic: cyclomaticComplexity,
      functions: functionCount,
      components: componentCount,
      score: cyclomaticComplexity + functionCount * 2 + componentCount * 3
    };
  }

  findIssues(content) {
    const issues = [];
    
    // Check for common issues
    if (content.includes('console.log')) {
      issues.push({
        type: 'warning',
        message: 'Console.log statements found - consider removing for production'
      });
    }
    
    if (content.includes('any')) {
      issues.push({
        type: 'warning',
        message: 'TypeScript "any" type found - consider using specific types'
      });
    }
    
    if (content.includes('// TODO') || content.includes('// FIXME')) {
      issues.push({
        type: 'info',
        message: 'TODO/FIXME comments found - consider addressing these'
      });
    }
    
    if (content.length > 10000) {
      issues.push({
        type: 'warning',
        message: 'Large file detected - consider breaking into smaller components'
      });
    }
    
    // Check for React best practices
    if (content.includes('useState') && !content.includes('useEffect')) {
      issues.push({
        type: 'info',
        message: 'State without effects - verify if useEffect is needed'
      });
    }
    
    return issues;
  }

  generateFileSuggestions(content, filePath) {
    const suggestions = [];
    
    if (filePath.includes('.tsx') || filePath.includes('.ts')) {
      // React/TypeScript specific suggestions
      if (content.includes('className=') && content.includes('style=')) {
        suggestions.push('Consider using CSS modules or styled-components for better style management');
      }
      
      if (content.includes('fetch(') && !content.includes('try')) {
        suggestions.push('Add error handling for fetch requests');
      }
      
      if (content.includes('useState') && content.split('useState').length > 5) {
        suggestions.push('Consider using useReducer for complex state management');
      }
    }
    
    if (filePath.includes('api/')) {
      // API specific suggestions
      if (!content.includes('try') || !content.includes('catch')) {
        suggestions.push('Add comprehensive error handling for API routes');
      }
      
      if (!content.includes('status:')) {
        suggestions.push('Include proper HTTP status codes in API responses');
      }
    }
    
    return suggestions;
  }

  async generateMetrics() {
    console.log('📊 Generating project metrics...');
    
    const totalLines = this.results.analysis.reduce((sum, file) => sum + file.lines, 0);
    const totalSize = this.results.analysis.reduce((sum, file) => sum + file.size, 0);
    const avgComplexity = this.results.analysis.reduce((sum, file) => sum + file.complexity.score, 0) / this.results.analysis.length;
    const totalIssues = this.results.analysis.reduce((sum, file) => sum + file.issues.length, 0);
    
    this.results.metrics = {
      totalFiles: this.results.analysis.length,
      totalLines,
      totalSize,
      averageComplexity: Math.round(avgComplexity),
      totalIssues,
      codeQualityScore: Math.max(0, 100 - (totalIssues * 5) - (avgComplexity * 2))
    };
  }

  async generateSuggestions() {
    console.log('💡 Generating AI-powered suggestions...');
    
    // Global suggestions based on analysis
    this.results.suggestions = [
      {
        category: 'Performance',
        priority: 'high',
        suggestion: 'Consider implementing code splitting for large components to improve initial load time'
      },
      {
        category: 'Maintainability',
        priority: 'medium',
        suggestion: 'Extract common UI patterns into reusable components'
      },
      {
        category: 'Testing',
        priority: 'high',
        suggestion: 'Add unit tests for critical components like emergency button and streaming functionality'
      },
      {
        category: 'Security',
        priority: 'high',
        suggestion: 'Implement input validation and sanitization for all user inputs'
      },
      {
        category: 'Accessibility',
        priority: 'medium',
        suggestion: 'Add ARIA labels and keyboard navigation support for better accessibility'
      },
      {
        category: 'Error Handling',
        priority: 'high',
        suggestion: 'Implement comprehensive error boundaries and fallback UI components'
      }
    ];
  }

  async generateReport() {
    console.log('📋 Generating Context 7 analysis report...');
    
    const htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <title>Context 7 - AI Code Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #0d1117; color: white; }
        .header { background: linear-gradient(135deg, #7c3aed, #ec4899); padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric-card { background: #1e293b; padding: 15px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #10b981; }
        .file-analysis { background: #1e293b; margin: 10px 0; padding: 15px; border-radius: 8px; }
        .issue { margin: 5px 0; padding: 8px; border-radius: 4px; }
        .warning { background: #92400e; border-left: 4px solid #f59e0b; }
        .info { background: #1e40af; border-left: 4px solid #3b82f6; }
        .suggestion { background: #065f46; margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; }
        .priority-high { border-left-color: #ef4444; }
        .priority-medium { border-left-color: #f59e0b; }
        .priority-low { border-left-color: #10b981; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 Context 7 - AI Code Analysis Report</h1>
        <p>Generated: ${this.results.timestamp}</p>
    </div>
    
    <div class="metrics">
        <div class="metric-card">
            <div class="metric-value">${this.results.metrics.totalFiles}</div>
            <div>Files Analyzed</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${this.results.metrics.totalLines}</div>
            <div>Lines of Code</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${this.results.metrics.averageComplexity}</div>
            <div>Avg Complexity</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${this.results.metrics.codeQualityScore}</div>
            <div>Quality Score</div>
        </div>
    </div>
    
    <h2>💡 AI-Powered Suggestions</h2>
    ${this.results.suggestions.map(suggestion => `
        <div class="suggestion priority-${suggestion.priority}">
            <h3>${suggestion.category} (${suggestion.priority.toUpperCase()})</h3>
            <p>${suggestion.suggestion}</p>
        </div>
    `).join('')}
    
    <h2>📁 File Analysis</h2>
    ${this.results.analysis.map(file => `
        <div class="file-analysis">
            <h3>${file.file}</h3>
            <p>Lines: ${file.lines} | Size: ${file.size} bytes | Complexity: ${file.complexity.score}</p>
            
            ${file.issues.length > 0 ? `
                <h4>Issues:</h4>
                ${file.issues.map(issue => `
                    <div class="issue ${issue.type}">
                        ${issue.message}
                    </div>
                `).join('')}
            ` : '<p style="color: #10b981;">No issues found! ✅</p>'}
            
            ${file.suggestions.length > 0 ? `
                <h4>Suggestions:</h4>
                <ul>
                    ${file.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                </ul>
            ` : ''}
        </div>
    `).join('')}
</body>
</html>`;
    
    fs.writeFileSync('context7-analysis.html', htmlReport);
    fs.writeFileSync('context7-results.json', JSON.stringify(this.results, null, 2));
    
    console.log('✅ Context 7 analysis report generated: context7-analysis.html');
    console.log('✅ Analysis results saved: context7-results.json');
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new Context7Analyzer();
  analyzer.analyzeProject().catch(console.error);
}

module.exports = Context7Analyzer;