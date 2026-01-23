export interface Category {
    id: string;
    name: string;
}

export interface WorkItem {
    id: string;
    title: string;
    description: string;
    status: 'CAPTURED' | 'CLARIFYING' | 'THINKING' | 'DECIDED' | 'IN_PROGRESS' | 'IN_REVIEW' | 'CLOSED' | 'ARCHIVED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    createdBy: string;
    createdAt?: string;
    updatedAt?: string;
    logs?: Log[];
    customFieldValues?: any[];
    [key: string]: any; // Allow other properties for now
}

export interface Log {
    id: string;
    message: string;
    timestamp: string;
    type?: string;
    workItemId?: string;
    workItem?: {
        id: string;
        title: string;
    };
    [key: string]: any;
}

export interface Idea {
    id: number;
    text: string;
}

export type ViewType = 'work-items' | 'logs' | 'ideas';
