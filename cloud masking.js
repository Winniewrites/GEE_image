/**
 * Function to mask clouds using the Sentinel-2 QA band
 * @param {ee.Image} image Sentinel-2 image
 * @return {ee.Image} cloud masked Sentinel-2 image
 */
function maskS2clouds(image) {
  var qa = image.select('QA60');

  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return image.updateMask(mask).divide(10000);
}

var dataset = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                  .filterDate('2020-01-01', '2020-01-30')
                  .filterBounds(geometry)
                  // Pre-filter to get less cloudy granules.
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20))
                  .map(maskS2clouds);
// print('dataset',dataset)

var visualization = {
  min: 0.0,
  max: 0.3,
  bands: ['B4', 'B3', 'B2'],
};
Map.centerObject(geometry);

Map.addLayer(dataset.mean(), visualization, 'True Color (432)');
var image = dataset.mean().clip(geometry).select(['B6', 'B5', 'B4', 'B3', 'B2']);
Map.addLayer(image, visualization, 'image');