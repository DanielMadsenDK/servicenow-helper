import { StreamingRequest } from '@/types';

export function validateRequest(body: StreamingRequest): string | null {
    if (!body.question || !body.type) {
        return 'Missing required fields: question and type are required';
    }

    // Validate request type
    const allowedTypes = ['documentation', 'recommendation', 'script', 'troubleshoot', 'ai-agent', 'ai-skill'];
    if (!allowedTypes.includes(body.type)) {
        return `Invalid request type: ${body.type}. Allowed types: ${allowedTypes.join(', ')}`;
    }
    if (!body.aiModel && (!body.agentModels || body.agentModels.length === 0)) {
        return 'Either aiModel or agentModels with at least one agent configuration must be provided';
    }
    if (body.agentModels) {
        const allowedAgents = ['orchestration', 'planner_large', 'planner_small', 'coder_large', 'coder_small', 'architect_large', 'architect_small', 'process_sme_large', 'process_sme_small'];
        for (const agentModel of body.agentModels) {
            if (!agentModel.agent || !agentModel.model) {
                return 'Each agent configuration must have both agent and model properties';
            }
            if (!allowedAgents.includes(agentModel.agent)) {
                return `Invalid agent name: ${agentModel.agent}. Allowed agents: ${allowedAgents.join(', ')}`;
            }
        }
    }
    if (body.file) {
        if(typeof body.file !== 'string') {
            return 'File must be a base64 encoded string';
        }
        if (body.file.length > 10 * 1024 * 1024 * 1.33) { // ~10MB limit
            return 'File too large (max 10MB)';
        }
    }
    return null;
}