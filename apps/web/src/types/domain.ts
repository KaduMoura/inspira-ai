export enum MatchBand {
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW',
}

export interface Product {
    id: string;
    title: string;
    category: string;
    type: string;
    price: number;
    width?: number;
    height?: number;
    depth?: number;
    description: string;
}

export interface ScoredCandidate extends Product {
    score: number;
    matchBand: MatchBand;
    reasons: string[];
}
