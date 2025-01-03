// Applies scaling factors.
function applyScaleFactors(image) {
 var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
 var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBands, null, true);
}

var dataset = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filterDate('2021-08-20', '2021-12-18')
    .filterBounds(geometry)
    .filterMetadata('CLOUD_COVER', 'less_than',10)
    .map(applyScaleFactors)

dataset = dataset

var visualization = {
  bands: ['SR_B4', 'SR_B3', 'SR_B2'],
  min: 0.0,
  max: 0.3,
};

Map.centerObject(geometry);
// Map.addLayer(dataset.first(), visualization, 'True Color (432)');
var image = dataset.first().clip(geometry)
Map.addLayer(image, visualization, 'image');

// Create Training Data
var label = 'Class';
var bands = ['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'];
var input = image.select(bands);

var training = Grassland.merge(Bareland).merge(Forest).merge(Cropland).merge(Wetland).merge(BuiltupArea);
print(training);

//Overlay the points on the image to get training sites
var trainImage = input.sampleRegions({
  collection: training,
  properties: [label],
  scale: 30
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
  '#24ffd4', //Wetland (0)
  '#73198b', //BuiltupArea(1)
  '#09460d', //Forest(2)
  '#52a441', //Cropland(3)
  '#86e616', //Grassland(4)
  '#864027', //Bareland(5)
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