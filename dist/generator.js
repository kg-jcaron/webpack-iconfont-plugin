'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (initialOptions) {
  var options = Object.assign({}, {
    ascent: undefined,
    centerHorizontally: false,
    cssFontPath: '/static/fonts/',
    descent: 0,
    fixedWidth: false,
    fontHeight: null,
    fontId: null,
    fontName: 'iconfont',
    fontStyle: '',
    fontWeight: '',
    formats: ['svg', 'ttf', 'eot', 'woff', 'woff2'],
    formatsOptions: {
      ttf: {
        copyright: null,
        ts: null,
        version: null
      }
    },
    glyphTransformFn: null,
    maxConcurrency: _os2.default.cpus().length,
    metadata: null,
    metadataProvider: null,
    normalize: false,
    prependUnicode: false,
    round: 10e12,
    startUnicode: 0xEA01,
    template: 'scss',
    verbose: false
  }, initialOptions);
  var svgs = options.svgs;

  var glyphsData = [];

  return (0, _globby2.default)([].concat(svgs)).then(function (foundFiles) {
    var filteredFiles = foundFiles.filter(function (foundFile) {
      return _path2.default.extname(foundFile) === '.svg';
    });

    if (filteredFiles.length === 0) {
      throw new Error('Iconfont glob patterns specified did not match any svgs');
    }

    options.foundFiles = foundFiles;
    return getGlyphsData(foundFiles, options);
  }).then(function (returnedGlyphsData) {
    glyphsData = returnedGlyphsData;
    return svgIcons2svgFontFn(returnedGlyphsData, options);
  }).then(function (svgFont) {
    var result = {};
    result.svg = svgFont;
    result.ttf = Buffer.from((0, _svg2ttf2.default)(result.svg.toString(), options.formatsOptions && options.formatsOptions.ttf ? options.formatsOptions.ttf : {}).buffer);

    if (options.formats.indexOf('eot') !== -1) {
      result.eot = Buffer.from((0, _ttf2eot2.default)(result.ttf).buffer);
    }

    if (options.formats.indexOf('woff') !== -1) {
      result.woff = Buffer.from((0, _ttf2woff2.default)(result.ttf, {
        metadata: options.metadata
      }).buffer);
    }

    if (options.formats.indexOf('woff2') !== -1) {
      result.woff2 = (0, _ttf2woff4.default)(result.ttf);
    }

    return result;
  }).then(function (result) {

    var buildInTemplateDirectory = _path2.default.resolve(__dirname, './templates');

    return (0, _globby2.default)(buildInTemplateDirectory + '/**/*').then(function (buildInTemplates) {
      var supportedExtensions = buildInTemplates.map(function (buildInTemplate) {
        return _path2.default.extname(buildInTemplate.replace('.njk', ''));
      });

      var templateFilePath = options.template;

      if (supportedExtensions.indexOf('.' + options.template) !== -1) {
        result.usedBuildInStylesTemplate = true;
        _nunjucks2.default.configure(_path2.default.join(__dirname, '../'));
        templateFilePath = buildInTemplateDirectory + '/template.' + options.template + '.njk';
      } else {
        templateFilePath = _path2.default.resolve(templateFilePath);
      }

      var nunjucksOptions = Object.assign({}, {
        glyphs: glyphsData.map(function (glyphData) {
          if (typeof options.glyphTransformFn === 'function') {
            options.glyphTransformFn(glyphData.metadata);
          }
          return glyphData.metadata;
        })
      }, options, {
        fontName: options.fontName,
        fontPath: options.cssFontPath
      });

      result.styles = _nunjucks2.default.render(templateFilePath, nunjucksOptions);

      return result;
    }).then(function (result) {
      if (options.formats.indexOf('svg') === -1) {
        delete result.svg;
      }

      if (options.formats.indexOf('ttf') === -1) {
        delete result.ttf;
      }
      result.config = options;
      return result;
    });
  });
};

var _asyncThrottle = require('async-throttle');

var _asyncThrottle2 = _interopRequireDefault(_asyncThrottle);

var _metadata = require('svgicons2svgfont/src/metadata');

var _metadata2 = _interopRequireDefault(_metadata);

var _filesorter = require('svgicons2svgfont/src/filesorter');

var _filesorter2 = _interopRequireDefault(_filesorter);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _globby = require('globby');

var _globby2 = _interopRequireDefault(_globby);

var _nunjucks = require('nunjucks');

var _nunjucks2 = _interopRequireDefault(_nunjucks);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _stream = require('stream');

var _svgicons2svgfont = require('svgicons2svgfont');

var _svgicons2svgfont2 = _interopRequireDefault(_svgicons2svgfont);

var _svg2ttf = require('svg2ttf');

var _svg2ttf2 = _interopRequireDefault(_svg2ttf);

var _ttf2eot = require('ttf2eot');

var _ttf2eot2 = _interopRequireDefault(_ttf2eot);

var _ttf2woff = require('ttf2woff');

var _ttf2woff2 = _interopRequireDefault(_ttf2woff);

var _ttf2woff3 = require('ttf2woff2');

var _ttf2woff4 = _interopRequireDefault(_ttf2woff3);

var _xml2js = require('xml2js');

var _xml2js2 = _interopRequireDefault(_xml2js);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getGlyphsData(files, options) {
  var metadataProvider = options.metadataProvider || (0, _metadata2.default)({
    prependUnicode: options.prependUnicode,
    startUnicode: options.startUnicode
  });

  var sortedFiles = files.sort(function (fileA, fileB) {
    return (0, _filesorter2.default)(fileA, fileB);
  });
  var xmlParser = new _xml2js2.default.Parser();
  var throttle = (0, _asyncThrottle2.default)(options.maxConcurrency);

  return Promise.all(sortedFiles.map(function (srcPath) {
    return throttle(function () {
      return new Promise(function (resolve, reject) {
        var glyph = _fs2.default.createReadStream(srcPath);
        var glyphContents = '';

        return glyph.on('error', function (glyphError) {
          return reject(glyphError);
        }).on('data', function (data) {
          glyphContents += data.toString();
        }).on('end', function () {
          if (glyphContents.length === 0) {
            return reject(new Error('Empty file ' + srcPath));
          }

          return xmlParser.parseString(glyphContents, function (error) {
            if (error) {
              return reject(error);
            }

            var glyphData = {
              contents: glyphContents,
              srcPath: srcPath
            };

            return resolve(glyphData);
          });
        });
      });
    }).then(function (glyphData) {
      return new Promise(function (resolve, reject) {
        metadataProvider(glyphData.srcPath, function (error, metadata) {
          if (error) {
            return reject(error);
          }
          glyphData.metadata = metadata;
          return resolve(glyphData);
        });
      });
    });
  }));
}

function svgIcons2svgFontFn(glyphsData, options) {
  var result = '';

  return new Promise(function (resolve, reject) {
    var fontStream = (0, _svgicons2svgfont2.default)({
      ascent: options.ascent,
      centerHorizontally: options.centerHorizontally,
      descent: options.descent,
      fixedWidth: options.fixedWidth,
      fontHeight: options.fontHeight,
      fontId: options.fontId,
      fontName: options.fontName,
      fontStyle: options.fontStyle,
      fontWeight: options.fontWeight,
      // eslint-disable-next-line no-console, no-empty-function
      log: options.vebose ? console.log.bind(console) : function () {},
      metadata: options.metadata,
      normalize: options.normalize,
      round: options.round
    }).on('finish', function () {
      return resolve(result);
    }).on('data', function (data) {
      result += data;
    }).on('error', function (error) {
      return reject(error);
    });

    glyphsData.forEach(function (glyphData) {
      var glyphStream = new _stream.Readable();

      glyphStream.push(glyphData.contents);
      glyphStream.push(null);

      glyphStream.metadata = glyphData.metadata;

      fontStream.write(glyphStream);
    });

    fontStream.end();
  });
}

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9nZW5lcmF0b3IuanMiXSwibmFtZXMiOlsiaW5pdGlhbE9wdGlvbnMiLCJvcHRpb25zIiwiT2JqZWN0IiwiYXNzaWduIiwiYXNjZW50IiwidW5kZWZpbmVkIiwiY2VudGVySG9yaXpvbnRhbGx5IiwiY3NzRm9udFBhdGgiLCJkZXNjZW50IiwiZml4ZWRXaWR0aCIsImZvbnRIZWlnaHQiLCJmb250SWQiLCJmb250TmFtZSIsImZvbnRTdHlsZSIsImZvbnRXZWlnaHQiLCJmb3JtYXRzIiwiZm9ybWF0c09wdGlvbnMiLCJ0dGYiLCJjb3B5cmlnaHQiLCJ0cyIsInZlcnNpb24iLCJnbHlwaFRyYW5zZm9ybUZuIiwibWF4Q29uY3VycmVuY3kiLCJjcHVzIiwibGVuZ3RoIiwibWV0YWRhdGEiLCJtZXRhZGF0YVByb3ZpZGVyIiwibm9ybWFsaXplIiwicHJlcGVuZFVuaWNvZGUiLCJyb3VuZCIsInN0YXJ0VW5pY29kZSIsInRlbXBsYXRlIiwidmVyYm9zZSIsInN2Z3MiLCJnbHlwaHNEYXRhIiwiY29uY2F0IiwidGhlbiIsImZpbHRlcmVkRmlsZXMiLCJmb3VuZEZpbGVzIiwiZmlsdGVyIiwiZXh0bmFtZSIsImZvdW5kRmlsZSIsIkVycm9yIiwiZ2V0R2x5cGhzRGF0YSIsInJldHVybmVkR2x5cGhzRGF0YSIsInN2Z0ljb25zMnN2Z0ZvbnRGbiIsInJlc3VsdCIsInN2ZyIsInN2Z0ZvbnQiLCJCdWZmZXIiLCJmcm9tIiwidG9TdHJpbmciLCJidWZmZXIiLCJpbmRleE9mIiwiZW90Iiwid29mZiIsIndvZmYyIiwiYnVpbGRJblRlbXBsYXRlRGlyZWN0b3J5IiwicmVzb2x2ZSIsIl9fZGlybmFtZSIsInN1cHBvcnRlZEV4dGVuc2lvbnMiLCJidWlsZEluVGVtcGxhdGVzIiwibWFwIiwiYnVpbGRJblRlbXBsYXRlIiwicmVwbGFjZSIsInRlbXBsYXRlRmlsZVBhdGgiLCJ1c2VkQnVpbGRJblN0eWxlc1RlbXBsYXRlIiwiY29uZmlndXJlIiwiam9pbiIsIm51bmp1Y2tzT3B0aW9ucyIsImdseXBocyIsImdseXBoRGF0YSIsImZvbnRQYXRoIiwic3R5bGVzIiwicmVuZGVyIiwiY29uZmlnIiwiZmlsZXMiLCJzb3J0ZWRGaWxlcyIsInNvcnQiLCJmaWxlQSIsImZpbGVCIiwieG1sUGFyc2VyIiwiUGFyc2VyIiwidGhyb3R0bGUiLCJQcm9taXNlIiwiYWxsIiwicmVqZWN0IiwiZ2x5cGgiLCJjcmVhdGVSZWFkU3RyZWFtIiwic3JjUGF0aCIsImdseXBoQ29udGVudHMiLCJvbiIsImdseXBoRXJyb3IiLCJkYXRhIiwicGFyc2VTdHJpbmciLCJlcnJvciIsImNvbnRlbnRzIiwiZm9udFN0cmVhbSIsImxvZyIsInZlYm9zZSIsImNvbnNvbGUiLCJiaW5kIiwiZm9yRWFjaCIsImdseXBoU3RyZWFtIiwicHVzaCIsIndyaXRlIiwiZW5kIl0sIm1hcHBpbmdzIjoiOzs7Ozs7a0JBNkhlLFVBQVNBLGNBQVQsRUFBeUI7QUFDdEMsTUFBSUMsVUFBVUMsT0FBT0MsTUFBUCxDQUNaLEVBRFksRUFFWjtBQUNFQyxZQUFRQyxTQURWO0FBRUVDLHdCQUFvQixLQUZ0QjtBQUdFQyxpQkFBYSxnQkFIZjtBQUlFQyxhQUFTLENBSlg7QUFLRUMsZ0JBQVksS0FMZDtBQU1FQyxnQkFBWSxJQU5kO0FBT0VDLFlBQVEsSUFQVjtBQVFFQyxjQUFVLFVBUlo7QUFTRUMsZUFBVyxFQVRiO0FBVUVDLGdCQUFZLEVBVmQ7QUFXRUMsYUFBUyxDQUFDLEtBQUQsRUFBUSxLQUFSLEVBQWUsS0FBZixFQUFzQixNQUF0QixFQUE4QixPQUE5QixDQVhYO0FBWUVDLG9CQUFnQjtBQUNkQyxXQUFLO0FBQ0hDLG1CQUFXLElBRFI7QUFFSEMsWUFBSSxJQUZEO0FBR0hDLGlCQUFTO0FBSE47QUFEUyxLQVpsQjtBQW1CRUMsc0JBQWtCLElBbkJwQjtBQW9CRUMsb0JBQWdCLGFBQUdDLElBQUgsR0FBVUMsTUFwQjVCO0FBcUJFQyxjQUFVLElBckJaO0FBc0JFQyxzQkFBa0IsSUF0QnBCO0FBdUJFQyxlQUFXLEtBdkJiO0FBd0JFQyxvQkFBZ0IsS0F4QmxCO0FBeUJFQyxXQUFPLEtBekJUO0FBMEJFQyxrQkFBYyxNQTFCaEI7QUEyQkVDLGNBQVUsTUEzQlo7QUE0QkVDLGFBQVM7QUE1QlgsR0FGWSxFQWdDWmhDLGNBaENZLENBQWQ7QUFEc0MsTUFtQzlCaUMsSUFuQzhCLEdBbUNyQmhDLE9BbkNxQixDQW1DOUJnQyxJQW5DOEI7O0FBb0N0QyxNQUFJQyxhQUFhLEVBQWpCOztBQUVBLFNBQ0Usc0JBQU8sR0FBR0MsTUFBSCxDQUFVRixJQUFWLENBQVAsRUFDQ0csSUFERCxDQUNNLHNCQUFjO0FBQ2xCLFFBQU1DLGdCQUFnQkMsV0FBV0MsTUFBWCxDQUNwQjtBQUFBLGFBQWEsZUFBS0MsT0FBTCxDQUFhQyxTQUFiLE1BQTRCLE1BQXpDO0FBQUEsS0FEb0IsQ0FBdEI7O0FBSUEsUUFBSUosY0FBY2IsTUFBZCxLQUF5QixDQUE3QixFQUFnQztBQUM5QixZQUFNLElBQUlrQixLQUFKLENBQ0oseURBREksQ0FBTjtBQUdEOztBQUVEekMsWUFBUXFDLFVBQVIsR0FBcUJBLFVBQXJCO0FBQ0EsV0FBT0ssY0FBY0wsVUFBZCxFQUEwQnJDLE9BQTFCLENBQVA7QUFDRCxHQWRELEVBY0dtQyxJQWRILENBY1EsOEJBQXNCO0FBQzVCRixpQkFBYVUsa0JBQWI7QUFDQSxXQUFPQyxtQkFBbUJELGtCQUFuQixFQUF1QzNDLE9BQXZDLENBQVA7QUFDRCxHQWpCRCxFQWlCR21DLElBakJILENBaUJRLG1CQUFXO0FBQ2pCLFFBQU1VLFNBQVMsRUFBZjtBQUNBQSxXQUFPQyxHQUFQLEdBQWFDLE9BQWI7QUFDQUYsV0FBTzdCLEdBQVAsR0FBYWdDLE9BQU9DLElBQVAsQ0FDWCx1QkFDRUosT0FBT0MsR0FBUCxDQUFXSSxRQUFYLEVBREYsRUFFRWxELFFBQVFlLGNBQVIsSUFBMEJmLFFBQVFlLGNBQVIsQ0FBdUJDLEdBQWpELEdBQ0loQixRQUFRZSxjQUFSLENBQXVCQyxHQUQzQixHQUVJLEVBSk4sRUFLRW1DLE1BTlMsQ0FBYjs7QUFTQSxRQUFJbkQsUUFBUWMsT0FBUixDQUFnQnNDLE9BQWhCLENBQXdCLEtBQXhCLE1BQW1DLENBQUMsQ0FBeEMsRUFBMkM7QUFDekNQLGFBQU9RLEdBQVAsR0FBYUwsT0FBT0MsSUFBUCxDQUFZLHVCQUFRSixPQUFPN0IsR0FBZixFQUFvQm1DLE1BQWhDLENBQWI7QUFDRDs7QUFFRCxRQUFJbkQsUUFBUWMsT0FBUixDQUFnQnNDLE9BQWhCLENBQXdCLE1BQXhCLE1BQW9DLENBQUMsQ0FBekMsRUFBNEM7QUFDMUNQLGFBQU9TLElBQVAsR0FBY04sT0FBT0MsSUFBUCxDQUNaLHdCQUFTSixPQUFPN0IsR0FBaEIsRUFBcUI7QUFDbkJRLGtCQUFVeEIsUUFBUXdCO0FBREMsT0FBckIsRUFFRzJCLE1BSFMsQ0FBZDtBQUtEOztBQUVELFFBQUluRCxRQUFRYyxPQUFSLENBQWdCc0MsT0FBaEIsQ0FBd0IsT0FBeEIsTUFBcUMsQ0FBQyxDQUExQyxFQUE2QztBQUMzQ1AsYUFBT1UsS0FBUCxHQUFlLHdCQUFVVixPQUFPN0IsR0FBakIsQ0FBZjtBQUNEOztBQUVELFdBQU82QixNQUFQO0FBQ0QsR0E5Q0QsRUE4Q0dWLElBOUNILENBOENRLGtCQUFVOztBQUVoQixRQUFNcUIsMkJBQTJCLGVBQUtDLE9BQUwsQ0FDL0JDLFNBRCtCLEVBRS9CLGFBRitCLENBQWpDOztBQUtBLFdBQU8sc0JBQ0ZGLHdCQURFLFlBRUxyQixJQUZLLENBRUEsNEJBQW9CO0FBQ3pCLFVBQU13QixzQkFBc0JDLGlCQUFpQkMsR0FBakIsQ0FDMUI7QUFBQSxlQUNFLGVBQUt0QixPQUFMLENBQ0V1QixnQkFBZ0JDLE9BQWhCLENBQXdCLE1BQXhCLEVBQWdDLEVBQWhDLENBREYsQ0FERjtBQUFBLE9BRDBCLENBQTVCOztBQU9BLFVBQUlDLG1CQUFtQmhFLFFBQVE4QixRQUEvQjs7QUFFQSxVQUNFNkIsb0JBQW9CUCxPQUFwQixPQUNNcEQsUUFBUThCLFFBRGQsTUFFTSxDQUFDLENBSFQsRUFJRTtBQUNBZSxlQUFPb0IseUJBQVAsR0FBbUMsSUFBbkM7QUFDQSwyQkFBU0MsU0FBVCxDQUFtQixlQUFLQyxJQUFMLENBQVVULFNBQVYsRUFBcUIsS0FBckIsQ0FBbkI7QUFDQU0sMkJBQXNCUix3QkFBdEIsa0JBQTJEeEQsUUFBUThCLFFBQW5FO0FBQ0QsT0FSRCxNQVFPO0FBQ0hrQywyQkFBbUIsZUFBS1AsT0FBTCxDQUFhTyxnQkFBYixDQUFuQjtBQUNIOztBQUVELFVBQU1JLGtCQUFrQm5FLE9BQU9DLE1BQVAsQ0FDdEIsRUFEc0IsRUFFdEI7QUFDRW1FLGdCQUFRcEMsV0FBVzRCLEdBQVgsQ0FBZSxxQkFBYTtBQUNsQyxjQUFJLE9BQU83RCxRQUFRb0IsZ0JBQWYsS0FBb0MsVUFBeEMsRUFBb0Q7QUFDbERwQixvQkFBUW9CLGdCQUFSLENBQ0VrRCxVQUFVOUMsUUFEWjtBQUdEO0FBQ0QsaUJBQU84QyxVQUFVOUMsUUFBakI7QUFDRCxTQVBPO0FBRFYsT0FGc0IsRUFZdEJ4QixPQVpzQixFQWF0QjtBQUNFVyxrQkFBVVgsUUFBUVcsUUFEcEI7QUFFRTRELGtCQUFVdkUsUUFBUU07QUFGcEIsT0Fic0IsQ0FBeEI7O0FBbUJBdUMsYUFBTzJCLE1BQVAsR0FBZ0IsbUJBQVNDLE1BQVQsQ0FDZFQsZ0JBRGMsRUFFZEksZUFGYyxDQUFoQjs7QUFLQSxhQUFPdkIsTUFBUDtBQUNELEtBakRNLEVBaURKVixJQWpESSxDQWlEQyxrQkFBVTtBQUNoQixVQUFJbkMsUUFBUWMsT0FBUixDQUFnQnNDLE9BQWhCLENBQXdCLEtBQXhCLE1BQW1DLENBQUMsQ0FBeEMsRUFBMkM7QUFDekMsZUFBT1AsT0FBT0MsR0FBZDtBQUNEOztBQUVELFVBQUk5QyxRQUFRYyxPQUFSLENBQWdCc0MsT0FBaEIsQ0FBd0IsS0FBeEIsTUFBbUMsQ0FBQyxDQUF4QyxFQUEyQztBQUN6QyxlQUFPUCxPQUFPN0IsR0FBZDtBQUNEO0FBQ0Q2QixhQUFPNkIsTUFBUCxHQUFnQjFFLE9BQWhCO0FBQ0EsYUFBTzZDLE1BQVA7QUFDRCxLQTNETSxDQUFQO0FBNERELEdBakhELENBREY7QUFvSEQsQzs7QUF2UkQ7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRUEsU0FBU0gsYUFBVCxDQUF1QmlDLEtBQXZCLEVBQThCM0UsT0FBOUIsRUFBdUM7QUFDckMsTUFBTXlCLG1CQUNKekIsUUFBUXlCLGdCQUFSLElBQ0Esd0JBQXdCO0FBQ3RCRSxvQkFBZ0IzQixRQUFRMkIsY0FERjtBQUV0QkUsa0JBQWM3QixRQUFRNkI7QUFGQSxHQUF4QixDQUZGOztBQU9BLE1BQU0rQyxjQUFjRCxNQUFNRSxJQUFOLENBQVcsVUFBQ0MsS0FBRCxFQUFRQyxLQUFSO0FBQUEsV0FBa0IsMEJBQVdELEtBQVgsRUFBa0JDLEtBQWxCLENBQWxCO0FBQUEsR0FBWCxDQUFwQjtBQUNBLE1BQU1DLFlBQVksSUFBSSxpQkFBT0MsTUFBWCxFQUFsQjtBQUNBLE1BQU1DLFdBQVcsNkJBQWVsRixRQUFRcUIsY0FBdkIsQ0FBakI7O0FBRUEsU0FBTzhELFFBQVFDLEdBQVIsQ0FDTFIsWUFBWWYsR0FBWixDQUFnQjtBQUFBLFdBQ2RxQixTQUNFO0FBQUEsYUFDRSxJQUFJQyxPQUFKLENBQVksVUFBQzFCLE9BQUQsRUFBVTRCLE1BQVYsRUFBcUI7QUFDL0IsWUFBTUMsUUFBUSxhQUFHQyxnQkFBSCxDQUFvQkMsT0FBcEIsQ0FBZDtBQUNFLFlBQUlDLGdCQUFnQixFQUFwQjs7QUFFQSxlQUFPSCxNQUNKSSxFQURJLENBQ0QsT0FEQyxFQUNRO0FBQUEsaUJBQWNMLE9BQU9NLFVBQVAsQ0FBZDtBQUFBLFNBRFIsRUFFSkQsRUFGSSxDQUVELE1BRkMsRUFFTyxnQkFBUTtBQUNsQkQsMkJBQWlCRyxLQUFLMUMsUUFBTCxFQUFqQjtBQUNELFNBSkksRUFLSndDLEVBTEksQ0FLRCxLQUxDLEVBS00sWUFBTTtBQUNmLGNBQUlELGNBQWNsRSxNQUFkLEtBQXlCLENBQTdCLEVBQWdDO0FBQzlCLG1CQUFPOEQsT0FDTCxJQUFJNUMsS0FBSixpQkFBd0IrQyxPQUF4QixDQURLLENBQVA7QUFHRDs7QUFFRCxpQkFBT1IsVUFBVWEsV0FBVixDQUNMSixhQURLLEVBRUwsaUJBQVM7QUFDUCxnQkFBSUssS0FBSixFQUFXO0FBQ1QscUJBQU9ULE9BQU9TLEtBQVAsQ0FBUDtBQUNEOztBQUVELGdCQUFNeEIsWUFBWTtBQUNoQnlCLHdCQUFVTixhQURNO0FBRWhCRDtBQUZnQixhQUFsQjs7QUFLQSxtQkFBTy9CLFFBQVFhLFNBQVIsQ0FBUDtBQUNELFdBYkksQ0FBUDtBQWVELFNBM0JJLENBQVA7QUE0QkQsT0FoQ0gsQ0FERjtBQUFBLEtBREYsRUFtQ0VuQyxJQW5DRixDQW9DRTtBQUFBLGFBQ0UsSUFBSWdELE9BQUosQ0FBWSxVQUFDMUIsT0FBRCxFQUFVNEIsTUFBVixFQUFxQjtBQUMvQjVELHlCQUNFNkMsVUFBVWtCLE9BRFosRUFFRSxVQUFDTSxLQUFELEVBQVF0RSxRQUFSLEVBQXFCO0FBQ25CLGNBQUlzRSxLQUFKLEVBQVc7QUFDVCxtQkFBT1QsT0FBT1MsS0FBUCxDQUFQO0FBQ0Q7QUFDRHhCLG9CQUFVOUMsUUFBVixHQUFxQkEsUUFBckI7QUFDQSxpQkFBT2lDLFFBQVFhLFNBQVIsQ0FBUDtBQUNELFNBUkg7QUFVRCxPQVhELENBREY7QUFBQSxLQXBDRixDQURjO0FBQUEsR0FBaEIsQ0FESyxDQUFQO0FBc0REOztBQUVELFNBQVMxQixrQkFBVCxDQUE0QlgsVUFBNUIsRUFBd0NqQyxPQUF4QyxFQUFpRDtBQUMvQyxNQUFJNkMsU0FBUyxFQUFiOztBQUVBLFNBQU8sSUFBSXNDLE9BQUosQ0FBWSxVQUFDMUIsT0FBRCxFQUFVNEIsTUFBVixFQUFxQjtBQUN0QyxRQUFNVyxhQUFhLGdDQUFpQjtBQUNsQzdGLGNBQVFILFFBQVFHLE1BRGtCO0FBRWxDRSwwQkFBb0JMLFFBQVFLLGtCQUZNO0FBR2xDRSxlQUFTUCxRQUFRTyxPQUhpQjtBQUlsQ0Msa0JBQVlSLFFBQVFRLFVBSmM7QUFLbENDLGtCQUFZVCxRQUFRUyxVQUxjO0FBTWxDQyxjQUFRVixRQUFRVSxNQU5rQjtBQU9sQ0MsZ0JBQVVYLFFBQVFXLFFBUGdCO0FBUWxDQyxpQkFBV1osUUFBUVksU0FSZTtBQVNsQ0Msa0JBQVliLFFBQVFhLFVBVGM7QUFVbEM7QUFDQW9GLFdBQUtqRyxRQUFRa0csTUFBUixHQUFpQkMsUUFBUUYsR0FBUixDQUFZRyxJQUFaLENBQWlCRCxPQUFqQixDQUFqQixHQUE2QyxZQUFNLENBQUUsQ0FYeEI7QUFZbEMzRSxnQkFBVXhCLFFBQVF3QixRQVpnQjtBQWFsQ0UsaUJBQVcxQixRQUFRMEIsU0FiZTtBQWNsQ0UsYUFBTzVCLFFBQVE0QjtBQWRtQixLQUFqQixFQWdCbEI4RCxFQWhCa0IsQ0FnQmYsUUFoQmUsRUFnQkw7QUFBQSxhQUFNakMsUUFBUVosTUFBUixDQUFOO0FBQUEsS0FoQkssRUFpQmxCNkMsRUFqQmtCLENBaUJmLE1BakJlLEVBaUJQLGdCQUFRO0FBQ2hCN0MsZ0JBQVUrQyxJQUFWO0FBQ0gsS0FuQmtCLEVBb0JsQkYsRUFwQmtCLENBb0JmLE9BcEJlLEVBb0JOO0FBQUEsYUFBU0wsT0FBT1MsS0FBUCxDQUFUO0FBQUEsS0FwQk0sQ0FBbkI7O0FBc0JBN0QsZUFBV29FLE9BQVgsQ0FBbUIscUJBQWE7QUFDOUIsVUFBTUMsY0FBYyxzQkFBcEI7O0FBRUFBLGtCQUFZQyxJQUFaLENBQWlCakMsVUFBVXlCLFFBQTNCO0FBQ0FPLGtCQUFZQyxJQUFaLENBQWlCLElBQWpCOztBQUVBRCxrQkFBWTlFLFFBQVosR0FBdUI4QyxVQUFVOUMsUUFBakM7O0FBRUF3RSxpQkFBV1EsS0FBWCxDQUFpQkYsV0FBakI7QUFDRCxLQVREOztBQVdBTixlQUFXUyxHQUFYO0FBQ0QsR0FuQ00sQ0FBUDtBQW9DRCIsImZpbGUiOiJnZW5lcmF0b3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY3JlYXRlVGhyb3R0bGUgZnJvbSAnYXN5bmMtdGhyb3R0bGUnO1xuaW1wb3J0IGRlZmF1bHRNZXRhZGF0YVByb3ZpZGVyIGZyb20gJ3N2Z2ljb25zMnN2Z2ZvbnQvc3JjL21ldGFkYXRhJztcbmltcG9ydCBmaWxlU29ydGVyIGZyb20gJ3N2Z2ljb25zMnN2Z2ZvbnQvc3JjL2ZpbGVzb3J0ZXInO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBnbG9iYnkgZnJvbSAnZ2xvYmJ5JztcbmltcG9ydCBudW5qdWNrcyBmcm9tICdudW5qdWNrcyc7XG5pbXBvcnQgb3MgZnJvbSAnb3MnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQge1JlYWRhYmxlfSBmcm9tICdzdHJlYW0nO1xuaW1wb3J0IHN2Z2ljb25zMnN2Z2ZvbnQgZnJvbSAnc3ZnaWNvbnMyc3ZnZm9udCc7XG5pbXBvcnQgc3ZnMnR0ZiBmcm9tICdzdmcydHRmJztcbmltcG9ydCB0dGYyZW90IGZyb20gJ3R0ZjJlb3QnO1xuaW1wb3J0IHR0ZjJ3b2ZmIGZyb20gJ3R0ZjJ3b2ZmJztcbmltcG9ydCB0dGYyd29mZjIgZnJvbSAndHRmMndvZmYyJztcbmltcG9ydCB4bWwyanMgZnJvbSAneG1sMmpzJztcblxuZnVuY3Rpb24gZ2V0R2x5cGhzRGF0YShmaWxlcywgb3B0aW9ucykge1xuICBjb25zdCBtZXRhZGF0YVByb3ZpZGVyID1cbiAgICBvcHRpb25zLm1ldGFkYXRhUHJvdmlkZXIgfHxcbiAgICBkZWZhdWx0TWV0YWRhdGFQcm92aWRlcih7XG4gICAgICBwcmVwZW5kVW5pY29kZTogb3B0aW9ucy5wcmVwZW5kVW5pY29kZSxcbiAgICAgIHN0YXJ0VW5pY29kZTogb3B0aW9ucy5zdGFydFVuaWNvZGVcbiAgICB9KTtcblxuICBjb25zdCBzb3J0ZWRGaWxlcyA9IGZpbGVzLnNvcnQoKGZpbGVBLCBmaWxlQikgPT4gZmlsZVNvcnRlcihmaWxlQSwgZmlsZUIpKTtcbiAgY29uc3QgeG1sUGFyc2VyID0gbmV3IHhtbDJqcy5QYXJzZXIoKTtcbiAgY29uc3QgdGhyb3R0bGUgPSBjcmVhdGVUaHJvdHRsZShvcHRpb25zLm1heENvbmN1cnJlbmN5KTtcblxuICByZXR1cm4gUHJvbWlzZS5hbGwoXG4gICAgc29ydGVkRmlsZXMubWFwKHNyY1BhdGggPT5cbiAgICAgIHRocm90dGxlKFxuICAgICAgICAoKSA9PlxuICAgICAgICAgIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGdseXBoID0gZnMuY3JlYXRlUmVhZFN0cmVhbShzcmNQYXRoKTtcbiAgICAgICAgICAgICAgbGV0IGdseXBoQ29udGVudHMgPSAnJztcblxuICAgICAgICAgICAgICByZXR1cm4gZ2x5cGhcbiAgICAgICAgICAgICAgICAub24oJ2Vycm9yJywgZ2x5cGhFcnJvciA9PiByZWplY3QoZ2x5cGhFcnJvcikpXG4gICAgICAgICAgICAgICAgLm9uKCdkYXRhJywgZGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgICBnbHlwaENvbnRlbnRzICs9IGRhdGEudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgaWYgKGdseXBoQ29udGVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoXG4gICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKGBFbXB0eSBmaWxlICR7c3JjUGF0aH1gKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICByZXR1cm4geG1sUGFyc2VyLnBhcnNlU3RyaW5nKFxuICAgICAgICAgICAgICAgICAgICBnbHlwaENvbnRlbnRzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBnbHlwaERhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50czogZ2x5cGhDb250ZW50cyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyY1BhdGhcbiAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoZ2x5cGhEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICApLnRoZW4oXG4gICAgICAgIGdseXBoRGF0YSA9PlxuICAgICAgICAgIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIG1ldGFkYXRhUHJvdmlkZXIoXG4gICAgICAgICAgICAgIGdseXBoRGF0YS5zcmNQYXRoLFxuICAgICAgICAgICAgICAoZXJyb3IsIG1ldGFkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZ2x5cGhEYXRhLm1ldGFkYXRhID0gbWV0YWRhdGE7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoZ2x5cGhEYXRhKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KVxuICAgICAgKVxuICAgIClcbiAgKTtcbn1cblxuZnVuY3Rpb24gc3ZnSWNvbnMyc3ZnRm9udEZuKGdseXBoc0RhdGEsIG9wdGlvbnMpIHtcbiAgbGV0IHJlc3VsdCA9ICcnO1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY29uc3QgZm9udFN0cmVhbSA9IHN2Z2ljb25zMnN2Z2ZvbnQoe1xuICAgICAgYXNjZW50OiBvcHRpb25zLmFzY2VudCxcbiAgICAgIGNlbnRlckhvcml6b250YWxseTogb3B0aW9ucy5jZW50ZXJIb3Jpem9udGFsbHksXG4gICAgICBkZXNjZW50OiBvcHRpb25zLmRlc2NlbnQsXG4gICAgICBmaXhlZFdpZHRoOiBvcHRpb25zLmZpeGVkV2lkdGgsXG4gICAgICBmb250SGVpZ2h0OiBvcHRpb25zLmZvbnRIZWlnaHQsXG4gICAgICBmb250SWQ6IG9wdGlvbnMuZm9udElkLFxuICAgICAgZm9udE5hbWU6IG9wdGlvbnMuZm9udE5hbWUsXG4gICAgICBmb250U3R5bGU6IG9wdGlvbnMuZm9udFN0eWxlLFxuICAgICAgZm9udFdlaWdodDogb3B0aW9ucy5mb250V2VpZ2h0LFxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGUsIG5vLWVtcHR5LWZ1bmN0aW9uXG4gICAgICBsb2c6IG9wdGlvbnMudmVib3NlID8gY29uc29sZS5sb2cuYmluZChjb25zb2xlKSA6ICgpID0+IHt9LFxuICAgICAgbWV0YWRhdGE6IG9wdGlvbnMubWV0YWRhdGEsXG4gICAgICBub3JtYWxpemU6IG9wdGlvbnMubm9ybWFsaXplLFxuICAgICAgcm91bmQ6IG9wdGlvbnMucm91bmRcbiAgICB9KVxuICAgIC5vbignZmluaXNoJywgKCkgPT4gcmVzb2x2ZShyZXN1bHQpKVxuICAgIC5vbignZGF0YScsIGRhdGEgPT4ge1xuICAgICAgICByZXN1bHQgKz0gZGF0YTtcbiAgICB9KVxuICAgIC5vbignZXJyb3InLCBlcnJvciA9PiByZWplY3QoZXJyb3IpKTtcblxuICAgIGdseXBoc0RhdGEuZm9yRWFjaChnbHlwaERhdGEgPT4ge1xuICAgICAgY29uc3QgZ2x5cGhTdHJlYW0gPSBuZXcgUmVhZGFibGUoKTtcblxuICAgICAgZ2x5cGhTdHJlYW0ucHVzaChnbHlwaERhdGEuY29udGVudHMpO1xuICAgICAgZ2x5cGhTdHJlYW0ucHVzaChudWxsKTtcblxuICAgICAgZ2x5cGhTdHJlYW0ubWV0YWRhdGEgPSBnbHlwaERhdGEubWV0YWRhdGE7XG5cbiAgICAgIGZvbnRTdHJlYW0ud3JpdGUoZ2x5cGhTdHJlYW0pO1xuICAgIH0pO1xuXG4gICAgZm9udFN0cmVhbS5lbmQoKTtcbiAgfSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKGluaXRpYWxPcHRpb25zKSB7XG4gIGxldCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICB7fSxcbiAgICB7XG4gICAgICBhc2NlbnQ6IHVuZGVmaW5lZCxcbiAgICAgIGNlbnRlckhvcml6b250YWxseTogZmFsc2UsXG4gICAgICBjc3NGb250UGF0aDogJy9zdGF0aWMvZm9udHMvJyxcbiAgICAgIGRlc2NlbnQ6IDAsXG4gICAgICBmaXhlZFdpZHRoOiBmYWxzZSxcbiAgICAgIGZvbnRIZWlnaHQ6IG51bGwsXG4gICAgICBmb250SWQ6IG51bGwsXG4gICAgICBmb250TmFtZTogJ2ljb25mb250JyxcbiAgICAgIGZvbnRTdHlsZTogJycsXG4gICAgICBmb250V2VpZ2h0OiAnJyxcbiAgICAgIGZvcm1hdHM6IFsnc3ZnJywgJ3R0ZicsICdlb3QnLCAnd29mZicsICd3b2ZmMiddLFxuICAgICAgZm9ybWF0c09wdGlvbnM6IHtcbiAgICAgICAgdHRmOiB7XG4gICAgICAgICAgY29weXJpZ2h0OiBudWxsLFxuICAgICAgICAgIHRzOiBudWxsLFxuICAgICAgICAgIHZlcnNpb246IG51bGxcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGdseXBoVHJhbnNmb3JtRm46IG51bGwsXG4gICAgICBtYXhDb25jdXJyZW5jeTogb3MuY3B1cygpLmxlbmd0aCxcbiAgICAgIG1ldGFkYXRhOiBudWxsLFxuICAgICAgbWV0YWRhdGFQcm92aWRlcjogbnVsbCxcbiAgICAgIG5vcm1hbGl6ZTogZmFsc2UsXG4gICAgICBwcmVwZW5kVW5pY29kZTogZmFsc2UsXG4gICAgICByb3VuZDogMTBlMTIsXG4gICAgICBzdGFydFVuaWNvZGU6IDB4RUEwMSxcbiAgICAgIHRlbXBsYXRlOiAnc2NzcycsXG4gICAgICB2ZXJib3NlOiBmYWxzZVxuICAgIH0sXG4gICAgaW5pdGlhbE9wdGlvbnNcbiAgKTtcbiAgY29uc3QgeyBzdmdzIH0gPSBvcHRpb25zO1xuICBsZXQgZ2x5cGhzRGF0YSA9IFtdO1xuXG4gIHJldHVybiAoXG4gICAgZ2xvYmJ5KFtdLmNvbmNhdChzdmdzKSlcbiAgICAudGhlbihmb3VuZEZpbGVzID0+IHtcbiAgICAgIGNvbnN0IGZpbHRlcmVkRmlsZXMgPSBmb3VuZEZpbGVzLmZpbHRlcihcbiAgICAgICAgZm91bmRGaWxlID0+IHBhdGguZXh0bmFtZShmb3VuZEZpbGUpID09PSAnLnN2ZydcbiAgICAgICk7XG5cbiAgICAgIGlmIChmaWx0ZXJlZEZpbGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ0ljb25mb250IGdsb2IgcGF0dGVybnMgc3BlY2lmaWVkIGRpZCBub3QgbWF0Y2ggYW55IHN2Z3MnXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIG9wdGlvbnMuZm91bmRGaWxlcyA9IGZvdW5kRmlsZXM7XG4gICAgICByZXR1cm4gZ2V0R2x5cGhzRGF0YShmb3VuZEZpbGVzLCBvcHRpb25zKTtcbiAgICB9KS50aGVuKHJldHVybmVkR2x5cGhzRGF0YSA9PiB7XG4gICAgICBnbHlwaHNEYXRhID0gcmV0dXJuZWRHbHlwaHNEYXRhO1xuICAgICAgcmV0dXJuIHN2Z0ljb25zMnN2Z0ZvbnRGbihyZXR1cm5lZEdseXBoc0RhdGEsIG9wdGlvbnMpO1xuICAgIH0pLnRoZW4oc3ZnRm9udCA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICAgIHJlc3VsdC5zdmcgPSBzdmdGb250O1xuICAgICAgcmVzdWx0LnR0ZiA9IEJ1ZmZlci5mcm9tKFxuICAgICAgICBzdmcydHRmKFxuICAgICAgICAgIHJlc3VsdC5zdmcudG9TdHJpbmcoKSxcbiAgICAgICAgICBvcHRpb25zLmZvcm1hdHNPcHRpb25zICYmIG9wdGlvbnMuZm9ybWF0c09wdGlvbnMudHRmXG4gICAgICAgICAgICA/IG9wdGlvbnMuZm9ybWF0c09wdGlvbnMudHRmXG4gICAgICAgICAgICA6IHt9XG4gICAgICAgICkuYnVmZmVyXG4gICAgICApO1xuXG4gICAgICBpZiAob3B0aW9ucy5mb3JtYXRzLmluZGV4T2YoJ2VvdCcpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQuZW90ID0gQnVmZmVyLmZyb20odHRmMmVvdChyZXN1bHQudHRmKS5idWZmZXIpO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy5mb3JtYXRzLmluZGV4T2YoJ3dvZmYnKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0LndvZmYgPSBCdWZmZXIuZnJvbShcbiAgICAgICAgICB0dGYyd29mZihyZXN1bHQudHRmLCB7XG4gICAgICAgICAgICBtZXRhZGF0YTogb3B0aW9ucy5tZXRhZGF0YVxuICAgICAgICAgIH0pLmJ1ZmZlclxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy5mb3JtYXRzLmluZGV4T2YoJ3dvZmYyJykgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC53b2ZmMiA9IHR0ZjJ3b2ZmMihyZXN1bHQudHRmKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KS50aGVuKHJlc3VsdCA9PiB7XG5cbiAgICAgIGNvbnN0IGJ1aWxkSW5UZW1wbGF0ZURpcmVjdG9yeSA9IHBhdGgucmVzb2x2ZShcbiAgICAgICAgX19kaXJuYW1lLFxuICAgICAgICAnLi90ZW1wbGF0ZXMnXG4gICAgICApO1xuXG4gICAgICByZXR1cm4gZ2xvYmJ5KFxuICAgICAgICBgJHtidWlsZEluVGVtcGxhdGVEaXJlY3Rvcnl9LyoqLypgXG4gICAgICApLnRoZW4oYnVpbGRJblRlbXBsYXRlcyA9PiB7XG4gICAgICAgIGNvbnN0IHN1cHBvcnRlZEV4dGVuc2lvbnMgPSBidWlsZEluVGVtcGxhdGVzLm1hcChcbiAgICAgICAgICBidWlsZEluVGVtcGxhdGUgPT5cbiAgICAgICAgICAgIHBhdGguZXh0bmFtZShcbiAgICAgICAgICAgICAgYnVpbGRJblRlbXBsYXRlLnJlcGxhY2UoJy5uamsnLCAnJylcbiAgICAgICAgICAgIClcbiAgICAgICAgKTtcblxuICAgICAgICBsZXQgdGVtcGxhdGVGaWxlUGF0aCA9IG9wdGlvbnMudGVtcGxhdGU7XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIHN1cHBvcnRlZEV4dGVuc2lvbnMuaW5kZXhPZihcbiAgICAgICAgICAgIGAuJHtvcHRpb25zLnRlbXBsYXRlfWBcbiAgICAgICAgICApICE9PSAtMVxuICAgICAgICApIHtcbiAgICAgICAgICByZXN1bHQudXNlZEJ1aWxkSW5TdHlsZXNUZW1wbGF0ZSA9IHRydWU7XG4gICAgICAgICAgbnVuanVja3MuY29uZmlndXJlKHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8nKSk7XG4gICAgICAgICAgdGVtcGxhdGVGaWxlUGF0aCA9IGAke2J1aWxkSW5UZW1wbGF0ZURpcmVjdG9yeX0vdGVtcGxhdGUuJHtvcHRpb25zLnRlbXBsYXRlfS5uamtgO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGVtcGxhdGVGaWxlUGF0aCA9IHBhdGgucmVzb2x2ZSh0ZW1wbGF0ZUZpbGVQYXRoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG51bmp1Y2tzT3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICAgICAge30sXG4gICAgICAgICAge1xuICAgICAgICAgICAgZ2x5cGhzOiBnbHlwaHNEYXRhLm1hcChnbHlwaERhdGEgPT4ge1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuZ2x5cGhUcmFuc2Zvcm1GbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuZ2x5cGhUcmFuc2Zvcm1GbihcbiAgICAgICAgICAgICAgICAgIGdseXBoRGF0YS5tZXRhZGF0YVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIGdseXBoRGF0YS5tZXRhZGF0YTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSxcbiAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGZvbnROYW1lOiBvcHRpb25zLmZvbnROYW1lLFxuICAgICAgICAgICAgZm9udFBhdGg6IG9wdGlvbnMuY3NzRm9udFBhdGhcbiAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICAgICAgcmVzdWx0LnN0eWxlcyA9IG51bmp1Y2tzLnJlbmRlcihcbiAgICAgICAgICB0ZW1wbGF0ZUZpbGVQYXRoLFxuICAgICAgICAgIG51bmp1Y2tzT3B0aW9uc1xuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9KS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgIGlmIChvcHRpb25zLmZvcm1hdHMuaW5kZXhPZignc3ZnJykgPT09IC0xKSB7XG4gICAgICAgICAgZGVsZXRlIHJlc3VsdC5zdmc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy5mb3JtYXRzLmluZGV4T2YoJ3R0ZicpID09PSAtMSkge1xuICAgICAgICAgIGRlbGV0ZSByZXN1bHQudHRmO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdC5jb25maWcgPSBvcHRpb25zO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSlcbiAgICB9KVxuICApXG59XG4iXX0=