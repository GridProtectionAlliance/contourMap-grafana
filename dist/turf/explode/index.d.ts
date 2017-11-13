import { AllGeoJSON, FeatureCollection, Point } from './..//helpers'


/**
 * http://turfjs.org/docs/#explode
 */
export default function explode(
    features: AllGeoJSON
): FeatureCollection<Point>;
