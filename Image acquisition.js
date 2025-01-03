
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

// Map.addLayer(dataset.mean(), visualization, 'True Color (432)');
var image = dataset.mean().clip(geometry);
Map.addLayer(image, visualization, 'image');

// Create Training Data
var label = 'Class';
var bands = ['B2', 'B3', 'B4', 'B6', 'B8', 'B11','B12',];
var input = image.select(bands);

var training = Shrubland.merge(Bareland).merge(Forest).merge(Cropland).merge(Wetland).merge(Builtup);
print(training);

//Overlay the points on the image to get training sites
var trainImage = input.sampleRegions({
  collection: training,
  properties: [label],
  scale: 20
});
print(trainImage);

var trainingData = trainImage.randomColumn();
var trainSet = trainingData.filter(ee.Filter.lessThan('random',0.8)); //Training data
var testSet = trainingData.filter(ee.Filter.greaterThanOrEquals('random',0.8)); //Validation data

// Classifier model
var classifier = ee.Classifier.smileCart().train(trainSet, label, bands);

// Classify image
var classified = input.classify(classifier);
print(classified.getInfo());

//Define a color palette for the classification
var landcoverPalette = [
  '#1cece9', //Wetland (0)
  '#c622ff', //Builtup(1)
  '#1a8b21', //Forest(2)
  '#28d55b', //Cropland(3)
  '#caff42', //Shrubland(4)
  '#c27c29', //Bareland(5)
  ];
  
Map.addLayer(classified,{palette: landcoverPalette, min: 0, max: 4 }, 'classification');

// Accuracy assessment and confusion matrix
var confusionMatrix = ee.ConfusionMatrix(testSet.classify(classifier)
    .errorMatrix({
      actual: 'Class',
      predicted: 'classification',
    }));
    
print('Confusion matrix:',confusionMatrix);
print('Overall Accuracy:',confusionMatrix.accuracy());

 
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

// Map.addLayer(dataset.mean(), visualization, 'True Color (432)');
var image = dataset.mean().clip(geometry);
Map.addLayer(image, visualization, 'image');

// Create Training Data
var label = 'Class';
var bands = ['B2', 'B3', 'B4', 'B6', 'B8', 'B11','B12',];
var input = image.select(bands);

var training = Shrubland.merge(Bareland).merge(Forest).merge(Cropland).merge(Wetland).merge(Builtup);
print(training);

//Overlay the points on the image to get training sites
var trainImage = input.sampleRegions({
  collection: training,
  properties: [label],
  scale: 20
});
print(trainImage);

var trainingData = trainImage.randomColumn();
var trainSet = trainingData.filter(ee.Filter.lessThan('random',0.8)); //Training data
var testSet = trainingData.filter(ee.Filter.greaterThanOrEquals('random',0.8)); //Validation data

// Classifier model
var classifier = ee.Classifier.smileCart().train(trainSet, label, bands);

// Classify image
var classified = input.classify(classifier);
print(classified.getInfo());

//Define a color palette for the classification
var landcoverPalette = [
  '#1cece9', //Wetland (0)
  '#c622ff', //Builtup(1)
  '#1a8b21', //Forest(2)
  '#28d55b', //Cropland(3)
  '#caff42', //Shrubland(4)
  '#c27c29', //Bareland(5)
  ];
  
Map.addLayer(classified,{palette: landcoverPalette, min: 0, max: 4 }, 'classification');

// Accuracy assessment and confusion matrix
var confusionMatrix = ee.ConfusionMatrix(testSet.classify(classifier)
    .errorMatrix({
      actual: 'Class',
      predicted: 'classification',
    }));
    
print('Confusion matrix:',confusionMatrix);
print('Overall Accuracy:',confusionMatrix.accuracy());