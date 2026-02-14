import { Db, Collection, Filter, ObjectId } from 'mongodb';
import { Product, SearchCriteria } from '../../domain/product';
import { getDb } from '../db';

export class CatalogRepository {
    private collection: Collection<Product>;

    constructor() {
        this.collection = getDb().collection<Product>('products');
    }

    /**
     * Main candidate retrieval logic with relaxation ladder.
     */
    async findCandidates(criteria: SearchCriteria): Promise<Product[]> {
        const limit = criteria.limit || 50;
        const minCandidates = 5;

        // Plan A: Category + Type + Keywords (High Precision)
        if (criteria.category && criteria.type && criteria.keywords?.length) {
            const results = await this.executePlanA(criteria, limit);
            if (results.length >= minCandidates) return results;
        }

        // Plan B: Category + Keywords
        if (criteria.category && criteria.keywords?.length) {
            const results = await this.executePlanB(criteria, limit);
            if (results.length >= minCandidates) return results;
        }

        // Plan C: Broad Keyword Search (Recall focus)
        if (criteria.keywords?.length) {
            const results = await this.executePlanC(criteria, limit);
            if (results.length >= minCandidates) return results;
        }

        // Plan D: Category + Type matching (if all keyword searches failed)
        if (criteria.category || criteria.type) {
            return this.executePlanD(criteria, limit);
        }

        return [];
    }

    private async executePlanA(criteria: SearchCriteria, limit: number): Promise<Product[]> {
        const query: Filter<Product> = {
            category: criteria.category,
            type: criteria.type,
            $or: criteria.keywords?.map(kw => ({
                $or: [
                    { title: { $regex: kw, $options: 'i' } },
                    { description: { $regex: kw, $options: 'i' } }
                ]
            })) || []
        };

        return this.collection.find(query).limit(limit).toArray();
    }

    private async executePlanB(criteria: SearchCriteria, limit: number): Promise<Product[]> {
        const query: Filter<Product> = {
            category: criteria.category,
            $or: criteria.keywords?.map(kw => ({
                $or: [
                    { title: { $regex: kw, $options: 'i' } },
                    { description: { $regex: kw, $options: 'i' } }
                ]
            })) || []
        };

        return this.collection.find(query).limit(limit).toArray();
    }

    private async executePlanC(criteria: SearchCriteria, limit: number): Promise<Product[]> {
        if (!criteria.keywords?.length) return [];

        const query: Filter<Product> = {
            $or: criteria.keywords.map(kw => ({
                $or: [
                    { title: { $regex: kw, $options: 'i' } },
                    { description: { $regex: kw, $options: 'i' } }
                ]
            }))
        };

        return this.collection.find(query).limit(limit).toArray();
    }

    private async executePlanD(criteria: SearchCriteria, limit: number): Promise<Product[]> {
        const filters: Filter<Product>[] = [];
        if (criteria.category) filters.push({ category: criteria.category });
        if (criteria.type) filters.push({ type: criteria.type });

        if (filters.length === 0) return [];

        const query: Filter<Product> = { $or: filters };

        return this.collection.find(query).limit(limit).toArray();
    }

    async findById(id: string): Promise<Product | null> {
        try {
            return this.collection.findOne({ _id: new ObjectId(id) } as any);
        } catch {
            return null; // Invalid ObjectId
        }
    }

    async findByTitle(title: string): Promise<Product | null> {
        return this.collection.findOne({ title: title } as any);
    }

    async getSample(): Promise<Product | null> {
        return this.collection.findOne({});
    }
}
