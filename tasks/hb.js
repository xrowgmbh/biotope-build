const fs = require('fs');
const path = require('path');

const config = require('./../config');
const $ = config.plugins;

$.gulp.task('static:hb', function () {

	const jsonParser = require('./../lib/json-parser');
	const hbsParser = require('./../lib/hbs-parser');
	const iconParser = require('./../lib/icon-parser');
	const iconNames = iconParser.getAllIconFileNamesLowerCase(path.join(config.global.cwd, config.global.src, 'resources', 'icons', '*.svg'));
	const preData = {};

	preData[config.global.dataObject] = {
		'icons': iconNames,
		'package': config.global.packageData
	};

	const hbsData = jsonParser.getAllJSONData(config.global.src + '/**/*.json', preData[config.global.dataObject]);
	const hbStream = hbsParser.createHbsGulpStream(
		[
			path.join(config.global.cwd, config.global.src, '**', '*.hbs'),
			'!' + path.join(config.global.cwd, config.global.src, 'pages', '**')
		],
		hbsData, null, config.global.debug
	);

	const sourcePaths = path.join(config.global.cwd, config.global.src, 'pages', '**', '*.hbs');
	const targetPath = path.join(config.global.cwd, config.global.dev);

	return $.gulp
		.src(sourcePaths)
		.pipe($.frontMatter({
			property: 'data.frontMatter',
			remove: true
		}))
		.pipe(hbStream)
		.on('error', $.notify.onError(function (error) {
			return {
				title: 'static:hb',
				message: `${error.message} in "${error.fileName}"`
			};
		}))
		.pipe($.rename({extname: ".html"}))
		.pipe($.gulp.dest(targetPath));

});


$.gulp.task('watch:static:hb', function () {

	const sourcePaths = [
		path.join(config.global.cwd, config.global.src, '**', '*.hbs'),
		path.join(config.global.cwd, config.global.src, '**', '*.json'),
		'!' + path.join(config.global.cwd, config.global.src, 'pages', '**')
	];

	$.watch(sourcePaths, config.watch, function () {
		$.runSequence(
			['static:hb']
		);
	});

});


/**
 * indexr creates the preview file index
 */
$.gulp.task('static:hb:indexr', function () {

	const hbsParser = require('./../lib/hbs-parser');
	const jsonParser = require('./../lib/json-parser');
	const browserSupportData = jsonParser.getBrowserSupportData();
	const dataObject = {
		package: config.global.packageData,
		templates: [],
		browserSupport: {}
	};

	if(config.global.tasks.browserSupport && browserSupportData) {
		dataObject.browserSupport = browserSupportData;
	}

	// read all files
	const filepaths = $.globule.find([
		path.join(config.global.cwd, config.global.src, 'pages', '*.hbs')
	]);

	let lastCategory = '';
	for (let index in filepaths) {
		let content = fs.readFileSync(filepaths[index], 'utf8');
		let templateInfo = {};

		templateInfo.file = path.parse(filepaths[index]);

		// check current category
		const category = templateInfo.file.name.substring(2, templateInfo.file.name.indexOf('.'));
		if (lastCategory !== category) {
			lastCategory = category;
			templateInfo.category = category;
			templateInfo.priority = templateInfo.file.name.substring(0, 2);
		}

		//parse content data
		const data = hbsParser.parsePartialData(content, { indexr: templateInfo }, config.global.debug);

		dataObject.templates.push(data);
	}

	if (config.global.debug) {
		console.log($.colors.green(`dataObject: ${JSON.stringify(dataObject)}`));
	}

	const hbStream = hbsParser.createHbsGulpStream(null, dataObject, null, config.global.debug);
	const sourcePaths = path.join(config.global.cwd, config.global.src, 'index.hbs');
	const targetPath = path.join(config.global.cwd, config.global.dev);

	return $.gulp.src(sourcePaths)
		.pipe(hbStream)
		.pipe($.rename({extname: ".html"}))
		.pipe($.gulp.dest(targetPath));

});

$.gulp.task('watch:static:hb:indexr', function () {

	const sourcePaths = path.join(config.global.cwd, config.global.src, 'pages', '*.hbs');

	$.watch(sourcePaths, config.watch, function () {
		$.runSequence(
			[
				'static:hb:indexr',
				'static:hb'
			]
		);
	});

});
