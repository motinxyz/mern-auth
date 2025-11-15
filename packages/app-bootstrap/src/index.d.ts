import { Application } from 'express';
import { Server } from 'http';

export declare function bootstrapApplication(app: Application): Promise<Server>;
