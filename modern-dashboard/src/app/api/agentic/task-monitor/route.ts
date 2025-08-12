import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Task scheduling schemas
const scheduleTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  schedule: z.string().min(1, 'Schedule is required'), // Cron expression or systemd timer format
  command: z.string().min(1, 'Command is required'),
  type: z.enum(['cron', 'systemd']).default('cron'),
  environment: z.record(z.string()).optional().default({}),
  workingDirectory: z.string().optional(),
  timeout: z.number().optional().default(3600), // 1 hour default
  retryPolicy: z.object({
    maxRetries: z.number().default(3),
    retryDelay: z.number().default(60), // seconds
    backoffMultiplier: z.number().default(2)
  }).optional(),
  notifications: z.array(z.object({
    type: z.enum(['email', 'webhook', 'slack']),
    target: z.string(),
    events: z.array(z.enum(['success', 'failure', 'timeout', 'retry']))
  })).optional().default([])
});

const executeTaskSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  parameters: z.record(z.any()).optional().default({}),
  timeout: z.number().optional(),
  async: z.boolean().optional().default(false)
});

// Agent authentication middleware
function verifyAgentToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  
  const token = authHeader.substring(7);
  const jwtSecret = process.env.JWT_SECRET || 'tactical-ops-secret-2024';
  
  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    if (decoded.type !== 'agent') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// In-memory task storage (in production, use database)
const tasks = new Map();
const taskExecutions = new Map();

// Schedule a new task
export async function POST(request: NextRequest) {
  try {
    // Verify agent authentication
    const agent = verifyAgentToken(request);
    
    // Check if agent has task automation capability
    if (!agent.capabilities.includes('task-automation')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS', 
            message: 'Agent does not have task-automation capability' 
          } 
        },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const validatedData = scheduleTaskSchema.parse(body);
    
    // Generate task ID
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create task object
    const task = {
      id: taskId,
      ...validatedData,
      agentId: agent.agentId,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nextRun: null,
      lastRun: null,
      executionCount: 0,
      successCount: 0,
      failureCount: 0
    };
    
    // Store task
    tasks.set(taskId, task);
    
    // Schedule task based on type
    if (validatedData.type === 'cron') {
      await scheduleCronJob(task);
    } else if (validatedData.type === 'systemd') {
      await scheduleSystemdTimer(task);
    }
    
    console.log(`📅 Task scheduled: ${taskId} by agent ${agent.agentId}`);
    
    return NextResponse.json({
      success: true,
      data: {
        taskId: taskId,
        name: task.name,
        schedule: task.schedule,
        type: task.type,
        status: task.status,
        nextRun: task.nextRun,
        createdAt: task.createdAt
      },
      message: 'Task scheduled successfully'
    });
    
  } catch (error) {
    console.error('Task scheduling error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid task data',
            details: error.errors 
          } 
        },
        { status: 400 }
      );
    }
    
    if (error.message.includes('token') || error.message.includes('authorization')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'AUTHENTICATION_ERROR', 
            message: error.message 
          } 
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to schedule task' 
        } 
      },
      { status: 500 }
    );
  }
}

// Get task status and list tasks
export async function GET(request: NextRequest) {
  try {
    // Verify agent authentication
    const agent = verifyAgentToken(request);
    
    // Check if agent has task automation capability
    if (!agent.capabilities.includes('task-automation')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS', 
            message: 'Agent does not have task-automation capability' 
          } 
        },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (taskId) {
      // Get specific task
      const task = tasks.get(taskId);
      if (!task) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'TASK_NOT_FOUND', 
              message: 'Task not found' 
            } 
          },
          { status: 404 }
        );
      }
      
      // Get recent executions for this task
      const executions = Array.from(taskExecutions.values())
        .filter(exec => exec.taskId === taskId)
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        .slice(0, 10);
      
      return NextResponse.json({
        success: true,
        data: {
          task,
          recentExecutions: executions
        },
        message: 'Task retrieved successfully'
      });
    }
    
    // List tasks
    let taskList = Array.from(tasks.values());
    
    // Filter by status if provided
    if (status) {
      taskList = taskList.filter(task => task.status === status);
    }
    
    // Filter by agent (agents can only see their own tasks)
    taskList = taskList.filter(task => task.agentId === agent.agentId);
    
    // Sort by creation date (newest first)
    taskList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Apply pagination
    const total = taskList.length;
    const paginatedTasks = taskList.slice(offset, offset + limit);
    
    return NextResponse.json({
      success: true,
      data: {
        tasks: paginatedTasks,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      },
      message: 'Tasks retrieved successfully'
    });
    
  } catch (error) {
    console.error('Task retrieval error:', error);
    
    if (error.message.includes('token') || error.message.includes('authorization')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'AUTHENTICATION_ERROR', 
            message: error.message 
          } 
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to retrieve tasks' 
        } 
      },
      { status: 500 }
    );
  }
}

// Execute a task immediately
export async function PUT(request: NextRequest) {
  try {
    // Verify agent authentication
    const agent = verifyAgentToken(request);
    
    // Check if agent has task automation capability
    if (!agent.capabilities.includes('task-automation')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS', 
            message: 'Agent does not have task-automation capability' 
          } 
        },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const validatedData = executeTaskSchema.parse(body);
    
    const task = tasks.get(validatedData.taskId);
    if (!task) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'TASK_NOT_FOUND', 
            message: 'Task not found' 
          } 
        },
        { status: 404 }
      );
    }
    
    // Check if agent owns the task
    if (task.agentId !== agent.agentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'ACCESS_DENIED', 
            message: 'Agent does not own this task' 
          } 
        },
        { status: 403 }
      );
    }
    
    // Generate execution ID
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create execution record
    const execution = {
      id: executionId,
      taskId: validatedData.taskId,
      agentId: agent.agentId,
      status: 'running',
      startedAt: new Date().toISOString(),
      parameters: validatedData.parameters,
      timeout: validatedData.timeout || task.timeout,
      output: '',
      error: null,
      exitCode: null,
      duration: null
    };
    
    taskExecutions.set(executionId, execution);
    
    // Update task
    task.status = 'running';
    task.lastRun = execution.startedAt;
    task.executionCount++;
    task.updatedAt = new Date().toISOString();
    tasks.set(task.id, task);
    
    if (validatedData.async) {
      // Execute asynchronously
      executeTaskAsync(task, execution, validatedData.parameters);
      
      return NextResponse.json({
        success: true,
        data: {
          executionId,
          taskId: task.id,
          status: 'running',
          startedAt: execution.startedAt,
          async: true
        },
        message: 'Task execution started asynchronously'
      });
    } else {
      // Execute synchronously
      const result = await executeTaskSync(task, execution, validatedData.parameters);
      
      return NextResponse.json({
        success: true,
        data: result,
        message: 'Task executed successfully'
      });
    }
    
  } catch (error) {
    console.error('Task execution error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid execution data',
            details: error.errors 
          } 
        },
        { status: 400 }
      );
    }
    
    if (error.message.includes('token') || error.message.includes('authorization')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'AUTHENTICATION_ERROR', 
            message: error.message 
          } 
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to execute task' 
        } 
      },
      { status: 500 }
    );
  }
}

// Delete/cancel a task
export async function DELETE(request: NextRequest) {
  try {
    // Verify agent authentication
    const agent = verifyAgentToken(request);
    
    // Check if agent has task automation capability
    if (!agent.capabilities.includes('task-automation')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS', 
            message: 'Agent does not have task-automation capability' 
          } 
        },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    
    if (!taskId) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'MISSING_TASK_ID', 
            message: 'Task ID is required' 
          } 
        },
        { status: 400 }
      );
    }
    
    const task = tasks.get(taskId);
    if (!task) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'TASK_NOT_FOUND', 
            message: 'Task not found' 
          } 
        },
        { status: 404 }
      );
    }
    
    // Check if agent owns the task
    if (task.agentId !== agent.agentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'ACCESS_DENIED', 
            message: 'Agent does not own this task' 
          } 
        },
        { status: 403 }
      );
    }
    
    // Cancel/remove scheduled task
    if (task.type === 'cron') {
      await cancelCronJob(task);
    } else if (task.type === 'systemd') {
      await cancelSystemdTimer(task);
    }
    
    // Remove task from storage
    tasks.delete(taskId);
    
    // Remove associated executions
    for (const [execId, execution] of taskExecutions.entries()) {
      if (execution.taskId === taskId) {
        taskExecutions.delete(execId);
      }
    }
    
    console.log(`🗑️ Task cancelled: ${taskId} by agent ${agent.agentId}`);
    
    return NextResponse.json({
      success: true,
      data: {
        taskId,
        status: 'cancelled'
      },
      message: 'Task cancelled successfully'
    });
    
  } catch (error) {
    console.error('Task cancellation error:', error);
    
    if (error.message.includes('token') || error.message.includes('authorization')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'AUTHENTICATION_ERROR', 
            message: error.message 
          } 
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to cancel task' 
        } 
      },
      { status: 500 }
    );
  }
}

// Helper functions for task scheduling and execution

async function scheduleCronJob(task: any) {
  try {
    // Create cron job script
    const scriptPath = `/tmp/tacticalops_task_${task.id}.sh`;
    const scriptContent = `#!/bin/bash
# TacticalOps Scheduled Task: ${task.name}
# Task ID: ${task.id}
# Schedule: ${task.schedule}

${Object.entries(task.environment).map(([key, value]) => `export ${key}="${value}"`).join('\n')}

cd ${task.workingDirectory || '/opt/tacticalops'}

# Execute the command
${task.command}
`;
    
    await fs.writeFile(scriptPath, scriptContent, { mode: 0o755 });
    
    // Add to crontab (simplified - in production, use proper cron management)
    const cronEntry = `${task.schedule} ${scriptPath}`;
    console.log(`Would add cron entry: ${cronEntry}`);
    
    // Update task with next run time (simplified calculation)
    task.nextRun = new Date(Date.now() + 60000).toISOString(); // Next minute for demo
    
  } catch (error) {
    console.error('Failed to schedule cron job:', error);
    throw error;
  }
}

async function scheduleSystemdTimer(task: any) {
  try {
    // Create systemd service and timer files
    const serviceName = `tacticalops-task-${task.id}`;
    
    const serviceContent = `[Unit]
Description=TacticalOps Task: ${task.name}
After=network.target

[Service]
Type=oneshot
User=tacticalops
WorkingDirectory=${task.workingDirectory || '/opt/tacticalops'}
${Object.entries(task.environment).map(([key, value]) => `Environment=${key}=${value}`).join('\n')}
ExecStart=${task.command}
TimeoutSec=${task.timeout}

[Install]
WantedBy=multi-user.target
`;
    
    const timerContent = `[Unit]
Description=TacticalOps Task Timer: ${task.name}
Requires=${serviceName}.service

[Timer]
OnCalendar=${task.schedule}
Persistent=true

[Install]
WantedBy=timers.target
`;
    
    console.log(`Would create systemd service: ${serviceName}`);
    console.log('Service content:', serviceContent);
    console.log('Timer content:', timerContent);
    
    // In production, would actually create and enable the systemd timer
    
  } catch (error) {
    console.error('Failed to schedule systemd timer:', error);
    throw error;
  }
}

async function executeTaskSync(task: any, execution: any, parameters: any) {
  const startTime = Date.now();
  
  try {
    // Prepare environment
    const env = { ...process.env, ...task.environment, ...parameters };
    
    // Execute command
    const { stdout, stderr } = await execAsync(task.command, {
      cwd: task.workingDirectory || process.cwd(),
      env,
      timeout: execution.timeout * 1000
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Update execution record
    execution.status = 'completed';
    execution.completedAt = new Date().toISOString();
    execution.output = stdout;
    execution.error = stderr || null;
    execution.exitCode = 0;
    execution.duration = duration;
    
    taskExecutions.set(execution.id, execution);
    
    // Update task
    const task_obj = tasks.get(task.id);
    task_obj.status = 'scheduled';
    task_obj.successCount++;
    task_obj.updatedAt = new Date().toISOString();
    tasks.set(task.id, task_obj);
    
    return {
      executionId: execution.id,
      taskId: task.id,
      status: 'completed',
      duration,
      output: stdout,
      exitCode: 0
    };
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Update execution record
    execution.status = 'failed';
    execution.completedAt = new Date().toISOString();
    execution.error = error.message;
    execution.exitCode = error.code || 1;
    execution.duration = duration;
    
    taskExecutions.set(execution.id, execution);
    
    // Update task
    const task_obj = tasks.get(task.id);
    task_obj.status = 'scheduled';
    task_obj.failureCount++;
    task_obj.updatedAt = new Date().toISOString();
    tasks.set(task.id, task_obj);
    
    throw error;
  }
}

async function executeTaskAsync(task: any, execution: any, parameters: any) {
  // Execute task asynchronously (simplified implementation)
  setTimeout(async () => {
    try {
      await executeTaskSync(task, execution, parameters);
    } catch (error) {
      console.error('Async task execution failed:', error);
    }
  }, 100);
}

async function cancelCronJob(task: any) {
  try {
    // Remove cron job script
    const scriptPath = `/tmp/tacticalops_task_${task.id}.sh`;
    try {
      await fs.unlink(scriptPath);
    } catch (error) {
      // File might not exist, ignore error
    }
    
    // In production, would remove from crontab
    console.log(`Would remove cron job for task ${task.id}`);
    
  } catch (error) {
    console.error('Failed to cancel cron job:', error);
  }
}

async function cancelSystemdTimer(task: any) {
  try {
    const serviceName = `tacticalops-task-${task.id}`;
    
    // In production, would stop and disable systemd timer
    console.log(`Would stop and disable systemd timer: ${serviceName}`);
    
  } catch (error) {
    console.error('Failed to cancel systemd timer:', error);
  }
}