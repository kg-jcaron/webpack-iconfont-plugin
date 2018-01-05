'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _nodeify = require('nodeify');

var _nodeify2 = _interopRequireDefault(_nodeify);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _globParent = require('glob-parent');

var _globParent2 = _interopRequireDefault(_globParent);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _generator = require('./generator');

var _generator2 = _interopRequireDefault(_generator);

var _hasha = require('hasha');

var _hasha2 = _interopRequireDefault(_hasha);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var IconfontPlugin = function () {
  function IconfontPlugin() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, IconfontPlugin);

    var required = ['svgs', 'fonts', 'styles'];

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = required[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var r = _step.value;

        if (!options[r]) {
          throw new Error('Require \'' + r + '\' option');
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    this.ran = false;

    this.options = Object.assign({}, options);
    this.fileDependencies = [];
    this.hashes = {};

    this.compile = this.compile.bind(this);
    this.watch = this.watch.bind(this);
  }

  _createClass(IconfontPlugin, [{
    key: 'apply',
    value: function apply(compiler) {
      compiler.plugin('run', this.compile);
      compiler.plugin('watch-run', this.compile);
      compiler.plugin('after-emit', this.watch);
    }
  }, {
    key: 'compile',
    value: function compile(compilation, callback) {
      var _this = this;

      var options = this.options,
          ran = this.ran;

      // Skip execution if already done and option is set

      if (options && options.initialOnly && ran) {
        return callback();
      }

      this.ran = true;

      return (0, _nodeify2.default)((0, _generator2.default)(options).then(function (result) {
        var fontName = result.config.fontName;

        var destStyles = null;

        if (result.styles) {
          destStyles = _path2.default.resolve(_this.options.styles);
        }

        return Promise.all(Object.keys(result).map(function (type) {
          if (type === 'config' || type === 'usedBuildInStylesTemplate') {
            return Promise.resolve();
          }

          var content = result[type];
          var hash = (0, _hasha2.default)(content);
          var destFilename = null;

          if (type !== 'styles') {
            destFilename = _path2.default.resolve(_path2.default.join(_this.options.fonts, fontName + '.' + type));
          } else {
            destFilename = _path2.default.resolve(destStyles);
          }

          if (_this.hashes[destFilename] !== hash) {
            _this.hashes[destFilename] = hash;
            return new Promise(function (resolve, reject) {
              _fsExtra2.default.outputFile(destFilename, content, function (error) {
                if (error) {
                  return reject(new Error(error));
                }
                return resolve();
              });
            });
          }
        }));
      }), function (error) {
        return callback(error);
      });
    }
  }, {
    key: 'watch',
    value: function watch(compilation, callback) {
      var globPatterns = typeof this.options.svgs === 'string' ? [this.options.svgs] : this.options.svgs;

      globPatterns.forEach(function (globPattern) {
        var context = (0, _globParent2.default)(globPattern);
        if (compilation.contextDependencies.indexOf(context) === -1) {
          compilation.contextDependencies.push(context);
        }
      });

      return callback();
    }
  }]);

  return IconfontPlugin;
}();

exports.default = IconfontPlugin;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJJY29uZm9udFBsdWdpbiIsIm9wdGlvbnMiLCJyZXF1aXJlZCIsInIiLCJFcnJvciIsInJhbiIsIk9iamVjdCIsImFzc2lnbiIsImZpbGVEZXBlbmRlbmNpZXMiLCJoYXNoZXMiLCJjb21waWxlIiwiYmluZCIsIndhdGNoIiwiY29tcGlsZXIiLCJwbHVnaW4iLCJjb21waWxhdGlvbiIsImNhbGxiYWNrIiwiaW5pdGlhbE9ubHkiLCJ0aGVuIiwiZm9udE5hbWUiLCJyZXN1bHQiLCJjb25maWciLCJkZXN0U3R5bGVzIiwic3R5bGVzIiwicmVzb2x2ZSIsIlByb21pc2UiLCJhbGwiLCJrZXlzIiwibWFwIiwidHlwZSIsImNvbnRlbnQiLCJoYXNoIiwiZGVzdEZpbGVuYW1lIiwiam9pbiIsImZvbnRzIiwicmVqZWN0Iiwib3V0cHV0RmlsZSIsImVycm9yIiwiZ2xvYlBhdHRlcm5zIiwic3ZncyIsImZvckVhY2giLCJjb250ZXh0IiwiZ2xvYlBhdHRlcm4iLCJjb250ZXh0RGVwZW5kZW5jaWVzIiwiaW5kZXhPZiIsInB1c2giXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7OztJQUVxQkEsYztBQUNuQiw0QkFBMEI7QUFBQSxRQUFkQyxPQUFjLHVFQUFKLEVBQUk7O0FBQUE7O0FBQ3hCLFFBQU1DLFdBQVcsQ0FBQyxNQUFELEVBQVMsT0FBVCxFQUFrQixRQUFsQixDQUFqQjs7QUFEd0I7QUFBQTtBQUFBOztBQUFBO0FBR3hCLDJCQUFjQSxRQUFkLDhIQUF3QjtBQUFBLFlBQWZDLENBQWU7O0FBQ3RCLFlBQUksQ0FBQ0YsUUFBUUUsQ0FBUixDQUFMLEVBQWlCO0FBQ2YsZ0JBQU0sSUFBSUMsS0FBSixnQkFBc0JELENBQXRCLGVBQU47QUFDRDtBQUNGO0FBUHVCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtB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QU8sS0FBS3JDLE9BQUwsQ0FBYXNDLElBQXBCLEtBQTZCLFFBQTdCLEdBQXdDLENBQUMsS0FBS3RDLE9BQUwsQ0FBYXNDLElBQWQsQ0FBeEMsR0FBOEQsS0FBS3RDLE9BQUwsQ0FBYXNDLElBQWhHOztBQUVBRCxtQkFBYUUsT0FBYixDQUFxQix1QkFBZTtBQUNsQyxZQUFNQyxVQUFVLDBCQUFXQyxXQUFYLENBQWhCO0FBQ0EsWUFBSTNCLFlBQVk0QixtQkFBWixDQUFnQ0MsT0FBaEMsQ0FBd0NILE9BQXhDLE1BQXFELENBQUMsQ0FBMUQsRUFBNkQ7QUFDM0QxQixzQkFBWTRCLG1CQUFaLENBQWdDRSxJQUFoQyxDQUFxQ0osT0FBckM7QUFDRDtBQUNGLE9BTEQ7O0FBT0EsYUFBT3pCLFVBQVA7QUFDRDs7Ozs7O2tCQWhHa0JoQixjIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG5vZGlmeSBmcm9tICdub2RlaWZ5JztcbmltcG9ydCBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgZ2xvYlBhcmVudCBmcm9tICdnbG9iLXBhcmVudCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBpY29uZm9udCBmcm9tICcuL2dlbmVyYXRvcidcbmltcG9ydCBoYXNoYSBmcm9tICdoYXNoYSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEljb25mb250UGx1Z2luIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgY29uc3QgcmVxdWlyZWQgPSBbJ3N2Z3MnLCAnZm9udHMnLCAnc3R5bGVzJ107XG5cbiAgICBmb3IgKGxldCByIG9mIHJlcXVpcmVkKSB7XG4gICAgICBpZiAoIW9wdGlvbnNbcl0pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZXF1aXJlICcke3J9JyBvcHRpb25gKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnJhbiA9IGZhbHNlO1xuXG4gICAgdGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucyk7XG4gICAgdGhpcy5maWxlRGVwZW5kZW5jaWVzID0gW107XG4gICAgdGhpcy5oYXNoZXMgPSB7fTtcblxuICAgIHRoaXMuY29tcGlsZSA9IHRoaXMuY29tcGlsZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMud2F0Y2ggPSB0aGlzLndhdGNoLmJpbmQodGhpcyk7XG4gIH1cblxuICBhcHBseShjb21waWxlcikge1xuICAgIGNvbXBpbGVyLnBsdWdpbigncnVuJywgdGhpcy5jb21waWxlKTtcbiAgICBjb21waWxlci5wbHVnaW4oJ3dhdGNoLXJ1bicsIHRoaXMuY29tcGlsZSk7XG4gICAgY29tcGlsZXIucGx1Z2luKCdhZnRlci1lbWl0JywgdGhpcy53YXRjaCk7XG4gIH1cblxuICBjb21waWxlKGNvbXBpbGF0aW9uLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IHsgb3B0aW9ucywgcmFuIH0gPSB0aGlzO1xuXG4gICAgLy8gU2tpcCBleGVjdXRpb24gaWYgYWxyZWFkeSBkb25lIGFuZCBvcHRpb24gaXMgc2V0XG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5pbml0aWFsT25seSAmJiByYW4pIHtcbiAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgIH1cblxuICAgIHRoaXMucmFuID0gdHJ1ZTtcblxuICAgIHJldHVybiBub2RpZnkoXG4gICAgICBpY29uZm9udChvcHRpb25zKS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgICAgY29uc3QgeyBmb250TmFtZSB9ID0gcmVzdWx0LmNvbmZpZztcbiAgICAgICAgICBsZXQgZGVzdFN0eWxlcyA9IG51bGw7XG5cbiAgICAgICAgICBpZiAocmVzdWx0LnN0eWxlcykge1xuICAgICAgICAgICAgICBkZXN0U3R5bGVzID0gcGF0aC5yZXNvbHZlKHRoaXMub3B0aW9ucy5zdHlsZXMpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChcbiAgICAgICAgICAgICAgT2JqZWN0LmtleXMocmVzdWx0KS5tYXAodHlwZSA9PiB7XG4gICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZSA9PT0gJ2NvbmZpZycgfHxcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlID09PSAndXNlZEJ1aWxkSW5TdHlsZXNUZW1wbGF0ZSdcbiAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9IHJlc3VsdFt0eXBlXTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGhhc2ggPSBoYXNoYShjb250ZW50KTtcbiAgICAgICAgICAgICAgICAgIGxldCBkZXN0RmlsZW5hbWUgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICBpZiAodHlwZSAhPT0gJ3N0eWxlcycpIHtcbiAgICAgICAgICAgICAgICAgICAgICBkZXN0RmlsZW5hbWUgPSBwYXRoLnJlc29sdmUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGguam9pbih0aGlzLm9wdGlvbnMuZm9udHMsIGAke2ZvbnROYW1lfS4ke3R5cGV9YClcbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBkZXN0RmlsZW5hbWUgPSBwYXRoLnJlc29sdmUoZGVzdFN0eWxlcyk7XG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhc2hlc1tkZXN0RmlsZW5hbWVdICE9PSBoYXNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGFzaGVzW2Rlc3RGaWxlbmFtZV0gPSBoYXNoO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGZzLm91dHB1dEZpbGUoZGVzdEZpbGVuYW1lLCBjb250ZW50LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoZXJyb3IpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICk7XG4gICAgICB9KSxcbiAgICAgIGVycm9yID0+IGNhbGxiYWNrKGVycm9yKVxuICAgICk7XG4gIH1cblxuICB3YXRjaChjb21waWxhdGlvbiwgY2FsbGJhY2spIHtcbiAgICBjb25zdCBnbG9iUGF0dGVybnMgPSB0eXBlb2YgdGhpcy5vcHRpb25zLnN2Z3MgPT09ICdzdHJpbmcnID8gW3RoaXMub3B0aW9ucy5zdmdzXSA6IHRoaXMub3B0aW9ucy5zdmdzO1xuXG4gICAgZ2xvYlBhdHRlcm5zLmZvckVhY2goZ2xvYlBhdHRlcm4gPT4ge1xuICAgICAgY29uc3QgY29udGV4dCA9IGdsb2JQYXJlbnQoZ2xvYlBhdHRlcm4pO1xuICAgICAgaWYgKGNvbXBpbGF0aW9uLmNvbnRleHREZXBlbmRlbmNpZXMuaW5kZXhPZihjb250ZXh0KSA9PT0gLTEpIHtcbiAgICAgICAgY29tcGlsYXRpb24uY29udGV4dERlcGVuZGVuY2llcy5wdXNoKGNvbnRleHQpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gIH1cbn1cbiJdfQ==