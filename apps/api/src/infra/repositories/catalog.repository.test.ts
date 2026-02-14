import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CatalogRepository } from './catalog.repository';
import * as dbModule from '../db';
import { Collection } from 'mongodb';

vi.mock('../db', () => ({
    getDb: vi.fn(),
}));

describe('CatalogRepository', () => {
    let repository: CatalogRepository;
    let mockCollection: any;

    beforeEach(() => {
        mockCollection = {
            find: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            toArray: vi.fn().mockResolvedValue([]),
            findOne: vi.fn().mockResolvedValue(null),
        };

        (dbModule.getDb as any).mockReturnValue({
            collection: vi.fn().mockReturnValue(mockCollection),
        });

        repository = new CatalogRepository();
    });

    it('should execute Plan A when category, type, and keywords are present', async () => {
        // Plan TEXT returns 0
        mockCollection.toArray.mockResolvedValueOnce([]);
        // Plan A returns results
        mockCollection.toArray.mockResolvedValueOnce([
            { title: 'Product A', description: 'desc', category: 'furn', type: 'chair', price: 100 },
            { title: 'A2', description: 'desc', category: 'furn', type: 'chair', price: 100 },
            { title: 'A3', description: 'desc', category: 'furn', type: 'chair', price: 100 },
            { title: 'A4', description: 'desc', category: 'furn', type: 'chair', price: 100 },
            { title: 'A5', description: 'desc', category: 'furn', type: 'chair', price: 100 }
        ]);

        const { products, plan } = await repository.findCandidates({
            category: 'furniture',
            type: 'chair',
            keywords: ['wood']
        });

        expect(products).toHaveLength(5);
        expect(plan).toBe('A');
        expect(mockCollection.find).toHaveBeenCalledWith(
            expect.objectContaining({
                category: 'furniture',
                type: 'chair',
                $or: expect.any(Array)
            }),
            expect.objectContaining({ projection: expect.any(Object) })
        );
    });

    it('should fallback to Plan B if Plan A returns too few results', async () => {
        // Plan TEXT returns 0
        mockCollection.toArray.mockResolvedValueOnce([]);
        // Plan A returns 1 (below threshold of 10)
        mockCollection.toArray.mockResolvedValueOnce([{
            title: 'A', description: 'desc', category: 'furn', type: 'chair', price: 100
        }]);
        // Plan B returns 12 (satisfies threshold)
        mockCollection.toArray.mockResolvedValueOnce(new Array(12).fill({
            title: 'B', description: 'desc', category: 'furn', type: 'chair', price: 100
        }));

        const { products, plan } = await repository.findCandidates({
            category: 'furniture',
            type: 'chair',
            keywords: ['wood'],
            minCandidates: 10
        });

        expect(products).toHaveLength(12);
        expect(plan).toBe('B');
        // TEXT call (1) + Plan A (2) + Plan B (3)
        expect(mockCollection.find).toHaveBeenNthCalledWith(3,
            expect.objectContaining({
                category: 'furniture',
                $or: expect.any(Array)
            }),
            expect.objectContaining({ projection: expect.any(Object) })
        );
    });

    it('should execute Plan C if no category/type provided but keywords exist', async () => {
        // Plan TEXT returns 0
        mockCollection.toArray.mockResolvedValueOnce([]);
        // Plan C returns something
        mockCollection.toArray.mockResolvedValueOnce([{
            title: 'Product C', description: 'desc', category: 'furn', type: 'chair', price: 100
        }]);

        const { products, plan } = await repository.findCandidates({
            keywords: ['chair']
        });

        expect(products).toHaveLength(1);
        expect(plan).toBe('C');
        expect(mockCollection.find).toHaveBeenCalledWith(
            expect.objectContaining({
                $or: expect.any(Array)
            }),
            expect.objectContaining({ projection: expect.any(Object) })
        );
    });

    it('should execute Plan D as last resort if category/type exist but keywords found nothing', async () => {
        // Plan TEXT, A, B, C all empty
        mockCollection.toArray.mockResolvedValueOnce([]);
        mockCollection.toArray.mockResolvedValueOnce([]);
        mockCollection.toArray.mockResolvedValueOnce([]);
        mockCollection.toArray.mockResolvedValueOnce([]);
        // Plan D returns something
        mockCollection.toArray.mockResolvedValueOnce([{
            title: 'D', description: 'desc', category: 'furn', type: 'chair', price: 100
        }]);

        const { products, plan } = await repository.findCandidates({
            category: 'furniture',
            type: 'chair',
            keywords: ['nonexistent']
        });

        expect(products).toHaveLength(1);
        expect(plan).toBe('D');
        expect(mockCollection.find).toHaveBeenLastCalledWith(
            {
                $or: [
                    { category: 'furniture' },
                    { type: 'chair' }
                ]
            },
            expect.objectContaining({ projection: expect.any(Object) })
        );
    });

    describe('findById', () => {
        it('should call findOne with ObjectId', async () => {
            const id = '507f1f77bcf86cd799439011';
            await repository.findById(id);
            expect(mockCollection.findOne).toHaveBeenCalledWith(expect.objectContaining({
                _id: expect.any(Object)
            }));
        });

        it('should return null for invalid ObjectId', async () => {
            const result = await repository.findById('invalid');
            expect(result).toBeNull();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
        });
    });

    describe('findByTitle', () => {
        it('should call findOne with title', async () => {
            await repository.findByTitle('My Product');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ title: 'My Product' });
        });
    });
});
