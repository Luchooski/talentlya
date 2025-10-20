import type { FastifyPluginAsync } from 'fastify';
import { candidateController } from './candidate.controller';

export const candidateRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.register(candidateController, { prefix: '/' });
};
