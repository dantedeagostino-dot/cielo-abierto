import { fetchFromNASA } from './telemetry';

const GENELAB_BASE_URL = 'https://genelab-data.ndc.nasa.gov/genelab/data/search';

export interface GenelabStudy {
    accession: string;
    title: string;
    organism: string;
    factor_value: string;
    assay_technology_type: string;
    project_type: string;
    description: string;
}

/**
 * Search GeneLab studies on space biology and radiation effects.
 * Source: https://genelab-data.ndc.nasa.gov/
 */
export async function searchGeneLab(
    query: string,
    size: number = 5
): Promise<{ total: number; studies: GenelabStudy[] }> {
    const result = await fetchFromNASA(GENELAB_BASE_URL, {
        term: query,
        type: 'cgene',
        size: size.toString(),
    }, { skipApiKey: true });

    const hits = result.hits || {};
    const total = hits.total || 0;

    const studies: GenelabStudy[] = (hits.hits || []).map((hit: any) => {
        const src = hit._source || {};
        return {
            accession: src.Accession || 'N/A',
            title: src.Study_Title || src.title || 'N/A',
            organism: Array.isArray(src.Organism) ? src.Organism.join(', ') : (src.Organism || 'N/A'),
            factor_value: Array.isArray(src.Factor_Value) ? src.Factor_Value.join(', ') : (src.Factor_Value || 'N/A'),
            assay_technology_type: src.Assay_Technology_Type || 'N/A',
            project_type: src.Project_Type || 'N/A',
            description: (src.Study_Description || src.description || '').substring(0, 300),
        };
    });

    return { total, studies };
}
