import { Db, Collection, Filter, ObjectId } from 'mongodb';
import { Product, SearchCriteria, ProductSchema } from '../../domain/product';
import { RetrievalPlan } from '../../domain/ai/schemas';
import { getDb } from '../db';

export class CatalogRepository {
    private collection: Collection<Product>;

    constructor() {
        this.collection = getDb().collection<Product>('products');
    }

    /**
     * Main candidate retrieval logic with relaxation ladder.
     */
    async findCandidates(criteria: SearchCriteria): Promise<{ products: Product[], plan: RetrievalPlan }> {
        const limit = criteria.limit || 60;
        const minCandidates = criteria.minCandidates || 10;

        // Try Plan TEXT first if keywords available
        if (criteria.keywords?.length) {
            try {
                const results = await this.executePlanText(criteria, limit);
                if (results.length >= minCandidates) return { products: results, plan: 'TEXT' };
            } catch (error) {
                // $text search might fail if index is missing (read-only prevents us from creating it)
                // Fallback silently to regex plans
            }
        }

        // Keep track of best results so far
        let lastResults: Product[] = [];
        let lastPlan: RetrievalPlan = 'D';

        // Plan A: Category + Type + Keywords (High Precision)
        if (criteria.category && criteria.type && criteria.keywords?.length) {
            const results = await this.executePlanA(criteria, limit);
            if (results.length >= minCandidates) return { products: results, plan: 'A' };
            lastResults = results;
            lastPlan = 'A';
        }

        // Plan B: Category + Keywords (Balanced)
        if (criteria.category && criteria.keywords?.length) {
            const results = await this.executePlanB(criteria, limit);
            if (results.length >= minCandidates) return { products: results, plan: 'B' };
            if (results.length > lastResults.length) {
                lastResults = results;
                lastPlan = 'B';
            }
        }

        // Plan C: Broad Keyword Search (Recall focus)
        if (criteria.keywords?.length) {
            const results = await this.executePlanC(criteria, limit);
            if (results.length >= minCandidates) return { products: results, plan: 'C' };
            if (results.length > lastResults.length) {
                lastResults = results;
                lastPlan = 'C';
            }
        }

        // Plan D: Category + Type matching (Fallback)
        if (criteria.category || criteria.type) {
            const results = await this.executePlanD(criteria, limit);
            if (results.length >= minCandidates) return { products: results, plan: 'D' };
            if (results.length > lastResults.length) {
                lastResults = results;
                lastPlan = 'D';
            }
        }

        return { products: lastResults, plan: lastPlan };
    }

    private async validateAndParse(docs: any[]): Promise<Product[]> {
        const validProducts: Product[] = [];
        for (const doc of docs) {
            const result = ProductSchema.safeParse(doc);
            if (result.success) {
                validProducts.push(result.data);
            } else {
                // Log and discard invalid docs to prevent pipeline crashes
                console.warn(`[CatalogRepository] Discarding invalid product document ${doc._id}:`, result.error.format());
            }
        }
        return validProducts;
    }

    private async executePlanText(criteria: SearchCriteria, limit: number): Promise<Product[]> {
        if (!criteria.keywords?.length) return [];
        const query: Filter<Product> = {
            $text: { $search: criteria.keywords.join(' ') }
        };
        const docs = await this.collection.find(query, { projection: this.getProjection() }).limit(limit).toArray();
        return this.validateAndParse(docs);
    }

    private getProjection() {
        return {
            _id: 1,
            title: 1,
            description: 1,
            category: 1,
            type: 1,
            price: 1,
            width: 1,
            height: 1,
            depth: 1
        };
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

        const docs = await this.collection.find(query, { projection: this.getProjection() }).limit(limit).toArray();
        return this.validateAndParse(docs);
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

        const docs = await this.collection.find(query, { projection: this.getProjection() }).limit(limit).toArray();
        return this.validateAndParse(docs);
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

        const docs = await this.collection.find(query, { projection: this.getProjection() }).limit(limit).toArray();
        return this.validateAndParse(docs);
    }

    private async executePlanD(criteria: SearchCriteria, limit: number): Promise<Product[]> {
        const filters: Filter<Product>[] = [];
        if (criteria.category) filters.push({ category: criteria.category });
        if (criteria.type) filters.push({ type: criteria.type });

        if (filters.length === 0) return [];

        const query: Filter<Product> = { $or: filters };

        const docs = await this.collection.find(query, { projection: this.getProjection() }).limit(limit).toArray();
        return this.validateAndParse(docs);
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
