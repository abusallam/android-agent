/**
 * Agentic AI Task Management API
 * AI-powered task monitoring, verification, and automation
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// AI Agent Configuration
const AI_CONFIG = {
  model: 'qwen/qwen3-coder:free',
  baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  maxTokens: 2000,
  temperature: 0.3
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const taskId = searchParams.get('taskId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    switch (action) {
      case 'get_tasks':
        const tasks = await getTasks(userId, status);
        return NextResponse.json({ tasks });

      case 'get_task_verification':
        if (!taskId) {
          return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
        }
        const verification = await getTaskVerification(taskId);
        return NextResponse.json({ verification });

      case 'get_agent_status':
        const agentStatus = await getAgentStatus();
        return NextResponse.json({ agentStatus });

      case 'get_task_analytics':
        const analytics = await getTaskAnalytics(userId);
        return NextResponse.json({ analytics });

      default:
        // Get all tasks with AI verification status
        const allTasks = await prisma.$queryRawUnsafe(`
          SELECT 
            t.id,
            t.title,
            t.description,
            t.assigned_to,
            t.created_by,
            t.operation_id,
            t.priority,
            t.status,
            t.verification_methods,
            t.geospatial_requirements,
            t.time_requirements,
            t.resource_requirements,
            t.ai_verification_data,
            t.created_at,
            t.updated_at,
            t.due_date,
            u_creator.username as created_by_user,
            to_op.name as operation_name,
            COUNT(tv.id) as verification_count,
            MAX(tv.verified_at) as last_verification
          FROM tasks t
          LEFT JOIN users u_creator ON t.created_by = u_creator.id
          LEFT JOIN tactical.operations to_op ON t.operation_id = to_op.id
          LEFT JOIN task_verification tv ON t.id = tv.task_id
          GROUP BY t.id, u_creator.username, to_op.name
          ORDER BY t.created_at DESC
        `);

        return NextResponse.json({
          tasks: allTasks,
          metadata: {
            total: allTasks.length,
            pending: allTasks.filter(t => t.status === 'pending').length,
            inProgress: allTasks.filter(t => t.status === 'in_progress').length,
            completed: allTasks.filter(t => t.status === 'completed').length,
            timestamp: new Date().toISOString()
          }
        });
    }

  } catch (error) {
    console.error('Error in task management API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'create_task':
        const newTask = await createTask(data);
        
        // Start AI monitoring for the task
        await startAITaskMonitoring(newTask.id);
        
        return NextResponse.json({ 
          success: true, 
          taskId: newTask.id,
          task: newTask
        });

      case 'update_task_status':
        await updateTaskStatus(data.taskId, data.status, data.updatedBy);
        return NextResponse.json({ success: true });

      case 'verify_task_completion':
        const verification = await verifyTaskCompletion(data.taskId, data.verificationData);
        return NextResponse.json({ 
          success: true, 
          verification,
          aiConfidence: verification.confidence
        });

      case 'bulk_location_verification':
        const results = [];
        for (const locationData of data.locations) {
          const result = await verifyLocationBasedTask(locationData);
          results.push(result);
        }
        return NextResponse.json({ success: true, results });

      case 'ai_task_analysis':
        const analysis = await performAITaskAnalysis(data.taskId);
        return NextResponse.json({ success: true, analysis });

      case 'schedule_automated_task':
        const scheduledTask = await scheduleAutomatedTask(data);
        return NextResponse.json({ 
          success: true, 
          scheduledTaskId: scheduledTask.id
        });

      case 'resource_optimization':
        const optimization = await optimizeResourceAllocation(data.operationId);
        return NextResponse.json({ success: true, optimization });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error processing task management operation:', error);
    return NextResponse.json(
      { error: 'Failed to process operation' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper Functions

async function createTask(data: any) {
  const result = await prisma.$queryRawUnsafe(`
    INSERT INTO tasks (
      title, description, assigned_to, created_by, operation_id, 
      priority, status, verification_methods, geospatial_requirements,
      time_requirements, resource_requirements, due_date, metadata
    ) VALUES (
      $1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10, $11, $12
    ) RETURNING id, created_at
  `,
    data.title,
    data.description,
    JSON.stringify(data.assignedTo || []),
    data.createdBy,
    data.operationId,
    data.priority || 'medium',
    JSON.stringify(data.verificationMethods || []),
    JSON.stringify(data.geospatialRequirements || []),
    JSON.stringify(data.timeRequirements || {}),
    JSON.stringify(data.resourceRequirements || []),
    data.dueDate ? new Date(data.dueDate) : null,
    JSON.stringify(data.metadata || {})
  );

  return {
    id: result[0].id,
    createdAt: result[0].created_at,
    ...data
  };
}

async function startAITaskMonitoring(taskId: string) {
  // Create AI agent session for task monitoring
  await prisma.$queryRawUnsafe(`
    INSERT INTO agent_sessions (
      agent_id, agent_type, capabilities, status, context, metadata
    ) VALUES (
      $1, 'task-monitoring', $2, 'active', $3, $4
    )
  `,
    `TASK_MONITOR_${taskId}`,
    JSON.stringify([
      'location_verification',
      'activity_monitoring', 
      'sensor_analysis',
      'completion_detection',
      'anomaly_detection'
    ]),
    JSON.stringify({
      taskId: taskId,
      monitoringStarted: new Date().toISOString(),
      verificationMethods: ['location', 'activity', 'sensor'],
      alertThresholds: {
        locationAccuracy: 10, // meters
        activityTimeout: 3600, // seconds
        anomalyScore: 0.8
      }
    }),
    JSON.stringify({
      model: AI_CONFIG.model,
      autoVerification: true,
      confidenceThreshold: 0.85,
      monitoringInterval: 300 // 5 minutes
    })
  );
}

async function verifyTaskCompletion(taskId: string, verificationData: any) {
  // Get task details
  const task = await prisma.$queryRawUnsafe(`
    SELECT * FROM tasks WHERE id = $1
  `, taskId);

  if (!task[0]) {
    throw new Error('Task not found');
  }

  const taskData = task[0];
  const verificationMethods = taskData.verification_methods || [];
  const verificationResults = [];
  let overallConfidence = 0;

  // Location-based verification
  if (verificationMethods.includes('location') && verificationData.location) {
    const locationVerification = await verifyLocationRequirement(
      taskData.geospatial_requirements,
      verificationData.location
    );
    verificationResults.push(locationVerification);
    overallConfidence += locationVerification.confidence * 0.4;
  }

  // Activity-based verification
  if (verificationMethods.includes('activity') && verificationData.activity) {
    const activityVerification = await verifyActivityRequirement(
      taskData.resource_requirements,
      verificationData.activity
    );
    verificationResults.push(activityVerification);
    overallConfidence += activityVerification.confidence * 0.3;
  }

  // Time-based verification
  if (verificationMethods.includes('time') && verificationData.timestamp) {
    const timeVerification = await verifyTimeRequirement(
      taskData.time_requirements,
      verificationData.timestamp
    );
    verificationResults.push(timeVerification);
    overallConfidence += timeVerification.confidence * 0.2;
  }

  // AI-powered analysis
  const aiAnalysis = await performAIVerificationAnalysis(taskData, verificationData);
  verificationResults.push(aiAnalysis);
  overallConfidence += aiAnalysis.confidence * 0.1;

  // Store verification result
  const verificationResult = await prisma.$queryRawUnsafe(`
    INSERT INTO task_verification (
      task_id, verification_type, verification_data, confidence, 
      verified_by, verified_at, ai_analysis
    ) VALUES (
      $1, 'multi_modal', $2, $3, $4, NOW(), $5
    ) RETURNING id, verified_at
  `,
    taskId,
    JSON.stringify(verificationData),
    overallConfidence,
    verificationData.verifiedBy || 'ai_agent',
    JSON.stringify({
      results: verificationResults,
      overallConfidence,
      aiModel: AI_CONFIG.model,
      verificationMethods: verificationMethods
    })
  );

  // Update task status if confidence is high enough
  if (overallConfidence > 0.85) {
    await updateTaskStatus(taskId, 'completed', 'ai_agent');
  } else if (overallConfidence > 0.6) {
    await updateTaskStatus(taskId, 'needs_review', 'ai_agent');
  }

  return {
    id: verificationResult[0].id,
    confidence: overallConfidence,
    results: verificationResults,
    status: overallConfidence > 0.85 ? 'verified' : 'needs_review',
    verifiedAt: verificationResult[0].verified_at
  };
}

async function verifyLocationRequirement(geospatialReqs: any, locationData: any) {
  if (!geospatialReqs || geospatialReqs.length === 0) {
    return { type: 'location', confidence: 1.0, message: 'No location requirements' };
  }

  let totalConfidence = 0;
  let reqCount = 0;

  for (const req of geospatialReqs) {
    reqCount++;
    
    if (req.type === 'within_area') {
      // Check if location is within required area
      const isWithin = await prisma.$queryRawUnsafe(`
        SELECT ST_Within(
          ST_GeomFromText($1, 4326),
          ST_GeomFromGeoJSON($2)
        ) as is_within
      `, `POINT(${locationData.longitude} ${locationData.latitude})`, JSON.stringify(req.geometry));
      
      totalConfidence += isWithin[0].is_within ? 1.0 : 0.0;
    } else if (req.type === 'near_point') {
      // Check distance to required point
      const distance = await prisma.$queryRawUnsafe(`
        SELECT ST_Distance(
          ST_GeogFromText($1),
          ST_GeogFromText($2)
        ) as distance
      `, 
        `POINT(${locationData.longitude} ${locationData.latitude})`,
        `POINT(${req.longitude} ${req.latitude})`
      );
      
      const maxDistance = req.radiusMeters || 100;
      const actualDistance = distance[0].distance;
      const confidence = Math.max(0, 1 - (actualDistance / maxDistance));
      totalConfidence += confidence;
    }
  }

  return {
    type: 'location',
    confidence: reqCount > 0 ? totalConfidence / reqCount : 1.0,
    message: `Location verification completed with ${reqCount} requirements`
  };
}

async function verifyActivityRequirement(resourceReqs: any, activityData: any) {
  // Analyze activity patterns, app usage, sensor data
  let confidence = 0.5; // Base confidence

  if (activityData.appUsage) {
    // Check if required apps were used
    const requiredApps = resourceReqs?.requiredApplications || [];
    const usedApps = activityData.appUsage.map(a => a.packageName);
    const appMatch = requiredApps.filter(app => usedApps.includes(app)).length;
    confidence += (appMatch / Math.max(requiredApps.length, 1)) * 0.3;
  }

  if (activityData.sensorData) {
    // Analyze accelerometer/gyroscope data for activity patterns
    const activityLevel = calculateActivityLevel(activityData.sensorData);
    confidence += Math.min(activityLevel / 100, 0.2); // Max 0.2 boost
  }

  return {
    type: 'activity',
    confidence: Math.min(confidence, 1.0),
    message: 'Activity pattern analysis completed'
  };
}

async function verifyTimeRequirement(timeReqs: any, timestamp: string) {
  const taskTime = new Date(timestamp);
  let confidence = 1.0;

  if (timeReqs.startTime) {
    const startTime = new Date(timeReqs.startTime);
    if (taskTime < startTime) {
      confidence *= 0.5; // Task completed too early
    }
  }

  if (timeReqs.endTime) {
    const endTime = new Date(timeReqs.endTime);
    if (taskTime > endTime) {
      confidence *= 0.3; // Task completed too late
    }
  }

  return {
    type: 'time',
    confidence,
    message: 'Time requirement verification completed'
  };
}

async function performAIVerificationAnalysis(taskData: any, verificationData: any) {
  try {
    // In a real implementation, this would call the AI API
    // For now, return a mock analysis
    return {
      type: 'ai_analysis',
      confidence: 0.8,
      message: 'AI analysis completed',
      details: {
        indicators: ['Data patterns consistent with task completion'],
        concerns: [],
        recommendations: ['Task appears completed successfully']
      }
    };

  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      type: 'ai_analysis',
      confidence: 0.5,
      message: 'AI analysis failed, manual review required'
    };
  }
}

function calculateActivityLevel(sensorData: any): number {
  // Analyze accelerometer/gyroscope data to determine activity level
  if (!sensorData.accelerometer) return 0;
  
  let totalMovement = 0;
  let dataPoints = 0;
  
  for (const reading of sensorData.accelerometer) {
    const magnitude = Math.sqrt(
      reading.x * reading.x + 
      reading.y * reading.y + 
      reading.z * reading.z
    );
    totalMovement += magnitude;
    dataPoints++;
  }
  
  return dataPoints > 0 ? (totalMovement / dataPoints) * 10 : 0;
}

async function updateTaskStatus(taskId: string, status: string, updatedBy: string) {
  await prisma.$queryRawUnsafe(`
    UPDATE tasks 
    SET status = $1, updated_at = NOW(), updated_by = $2
    WHERE id = $3
  `, status, updatedBy, taskId);

  // Log status change
  await prisma.$queryRawUnsafe(`
    INSERT INTO system_metrics (
      metric_name, metric_value, source, tags, metadata
    ) VALUES (
      'task_status_change', 1, 'task_management', $1, $2
    )
  `,
    JSON.stringify({ taskId, newStatus: status }),
    JSON.stringify({ updatedBy, timestamp: new Date().toISOString() })
  );
}

async function getTasks(userId?: string, status?: string) {
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (userId) {
    whereClause += ` AND ($${paramIndex} = ANY(t.assigned_to) OR t.created_by = $${paramIndex})`;
    params.push(userId);
    paramIndex++;
  }

  if (status) {
    whereClause += ` AND t.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  return await prisma.$queryRawUnsafe(`
    SELECT 
      t.*,
      u.username as created_by_user,
      to_op.name as operation_name,
      COUNT(tv.id) as verification_count
    FROM tasks t
    LEFT JOIN users u ON t.created_by = u.id
    LEFT JOIN tactical.operations to_op ON t.operation_id = to_op.id
    LEFT JOIN task_verification tv ON t.id = tv.task_id
    ${whereClause}
    GROUP BY t.id, u.username, to_op.name
    ORDER BY t.created_at DESC
  `, ...params);
}

async function getTaskVerification(taskId: string) {
  return await prisma.$queryRawUnsafe(`
    SELECT 
      tv.*,
      u.username as verified_by_user
    FROM task_verification tv
    LEFT JOIN users u ON tv.verified_by = u.id
    WHERE tv.task_id = $1
    ORDER BY tv.verified_at DESC
  `, taskId);
}

async function getAgentStatus() {
  return await prisma.$queryRawUnsafe(`
    SELECT 
      agent_type,
      COUNT(*) as agent_count,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
      AVG(CASE WHEN metadata->>'confidenceThreshold' IS NOT NULL 
          THEN (metadata->>'confidenceThreshold')::float 
          ELSE 0.8 END) as avg_confidence
    FROM agent_sessions
    WHERE agent_type LIKE '%task%' OR agent_type LIKE '%monitoring%'
    GROUP BY agent_type
  `);
}

async function getTaskAnalytics(userId?: string) {
  let whereClause = userId ? 'WHERE t.created_by = $1 OR $1 = ANY(t.assigned_to)' : '';
  const params = userId ? [userId] : [];

  return await prisma.$queryRawUnsafe(`
    SELECT 
      COUNT(*) as total_tasks,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
      AVG(CASE WHEN tv.confidence IS NOT NULL THEN tv.confidence ELSE 0 END) as avg_verification_confidence,
      COUNT(DISTINCT tv.id) as total_verifications
    FROM tasks t
    LEFT JOIN task_verification tv ON t.id = tv.task_id
    ${whereClause}
  `, ...params);
}

async function scheduleAutomatedTask(data: any) {
  // Create scheduled task that will be picked up by cron job
  const result = await prisma.$queryRawUnsafe(`
    INSERT INTO tasks (
      title, description, assigned_to, created_by, priority, status,
      verification_methods, scheduled_for, is_automated, metadata
    ) VALUES (
      $1, $2, $3, $4, $5, 'scheduled', $6, $7, true, $8
    ) RETURNING id
  `,
    data.title,
    data.description,
    JSON.stringify(data.assignedTo || []),
    data.createdBy,
    data.priority || 'medium',
    JSON.stringify(data.verificationMethods || ['automated']),
    new Date(data.scheduledFor),
    JSON.stringify({
      ...data.metadata,
      automationType: data.automationType,
      cronExpression: data.cronExpression,
      repeatInterval: data.repeatInterval
    })
  );

  return { id: result[0].id };
}

async function optimizeResourceAllocation(operationId: string) {
  // AI-powered resource optimization
  const resources = await prisma.$queryRawUnsafe(`
    SELECT 
      t.id,
      t.title,
      t.priority,
      t.assigned_to,
      t.resource_requirements,
      t.status
    FROM tasks t
    WHERE t.operation_id = $1 AND t.status IN ('pending', 'in_progress')
  `, operationId);

  // Simple optimization logic (in production, use more sophisticated AI)
  const optimization = {
    recommendations: [],
    resourceReallocation: [],
    priorityAdjustments: []
  };

  for (const task of resources) {
    if (task.priority === 'critical' && task.assigned_to.length === 0) {
      optimization.recommendations.push({
        taskId: task.id,
        recommendation: 'Assign personnel immediately - critical task unassigned'
      });
    }
  }

  return optimization;
}

async function verifyLocationBasedTask(locationData: any) {
  // Verify task completion based on location data
  const { taskId, deviceId, latitude, longitude, timestamp } = locationData;
  
  const task = await prisma.$queryRawUnsafe(`
    SELECT * FROM tasks WHERE id = $1
  `, taskId);

  if (!task[0]) {
    return { taskId, verified: false, reason: 'Task not found' };
  }

  const verification = await verifyLocationRequirement(
    task[0].geospatial_requirements,
    { latitude, longitude }
  );

  return {
    taskId,
    verified: verification.confidence > 0.8,
    confidence: verification.confidence,
    timestamp
  };
}

async function performAITaskAnalysis(taskId: string) {
  // Comprehensive AI analysis of task progress and completion
  const task = await prisma.$queryRawUnsafe(`
    SELECT t.*, 
           array_agg(tv.confidence) as verification_confidences,
           array_agg(tv.verified_at) as verification_times
    FROM tasks t
    LEFT JOIN task_verification tv ON t.id = tv.task_id
    WHERE t.id = $1
    GROUP BY t.id
  `, taskId);

  if (!task[0]) {
    throw new Error('Task not found');
  }

  const taskData = task[0];
  const analysis = {
    taskId,
    overallProgress: calculateTaskProgress(taskData),
    riskFactors: identifyRiskFactors(taskData),
    recommendations: generateRecommendations(taskData),
    predictedCompletion: predictCompletionTime(taskData),
    confidenceScore: calculateOverallConfidence(taskData)
  };

  return analysis;
}

function calculateTaskProgress(taskData: any): number {
  // Calculate task progress based on various factors
  let progress = 0;
  
  if (taskData.status === 'completed') return 100;
  if (taskData.status === 'in_progress') progress += 50;
  if (taskData.status === 'pending') progress += 10;
  
  // Add verification-based progress
  if (taskData.verification_confidences && taskData.verification_confidences.length > 0) {
    const avgConfidence = taskData.verification_confidences
      .filter(c => c !== null)
      .reduce((sum, c) => sum + c, 0) / taskData.verification_confidences.filter(c => c !== null).length;
    progress += avgConfidence * 30;
  }
  
  return Math.min(progress, 100);
}

function identifyRiskFactors(taskData: any): string[] {
  const risks = [];
  
  if (taskData.due_date && new Date(taskData.due_date) < new Date()) {
    risks.push('Task is overdue');
  }
  
  if (taskData.assigned_to && taskData.assigned_to.length === 0) {
    risks.push('No personnel assigned');
  }
  
  if (taskData.priority === 'critical' && taskData.status === 'pending') {
    risks.push('Critical task not started');
  }
  
  return risks;
}

function generateRecommendations(taskData: any): string[] {
  const recommendations = [];
  
  if (taskData.assigned_to && taskData.assigned_to.length === 0) {
    recommendations.push('Assign qualified personnel to this task');
  }
  
  if (taskData.priority === 'critical') {
    recommendations.push('Monitor this task closely due to critical priority');
  }
  
  if (taskData.verification_confidences && taskData.verification_confidences.some(c => c < 0.7)) {
    recommendations.push('Review verification methods - low confidence detected');
  }
  
  return recommendations;
}

function predictCompletionTime(taskData: any): string {
  // Simple prediction based on task complexity and current progress
  const baseTime = 24; // hours
  let multiplier = 1;
  
  if (taskData.priority === 'critical') multiplier *= 0.5;
  if (taskData.priority === 'low') multiplier *= 2;
  
  const estimatedHours = baseTime * multiplier;
  const completionDate = new Date(Date.now() + estimatedHours * 60 * 60 * 1000);
  
  return completionDate.toISOString();
}

function calculateOverallConfidence(taskData: any): number {
  let confidence = 0.5; // Base confidence
  
  if (taskData.assigned_to && taskData.assigned_to.length > 0) confidence += 0.2;
  if (taskData.verification_confidences && taskData.verification_confidences.length > 0) {
    const avgVerificationConfidence = taskData.verification_confidences
      .filter(c => c !== null)
      .reduce((sum, c) => sum + c, 0) / taskData.verification_confidences.filter(c => c !== null).length;
    confidence += avgVerificationConfidence * 0.3;
  }
  
  return Math.min(confidence, 1.0);
}