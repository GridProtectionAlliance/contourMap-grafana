import { MultiPolygon, Polygon, Feature, Coord } from './..//helpers'

/**
 * http://turfjs.org/docs/#booleanpointinpolygon
 */
export default function booleanPointInPolygon(
    point: Coord,
    polygon: Feature<Polygon | MultiPolygon> | Polygon | MultiPolygon,
    options?: {
        ignoreBoundary?: boolean
    }
): boolean;
