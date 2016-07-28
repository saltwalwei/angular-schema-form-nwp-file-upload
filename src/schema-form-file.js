'use strict';

angular
  .module('schemaForm')
  .config(['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
    function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {
      var defaultPatternMsg  = 'Wrong file type. Allowed types are ',
          defaultMaxSizeMsg1 = 'This file is too large. Maximum size allowed is ',
          defaultMaxSizeMsg2 = 'Current file size:',
          defaultMinItemsMsg = 'You have to upload at least one file',
          defaultMaxItemsMsg = 'You can\'t upload more than one file.';

      var nwpSinglefileUpload = function (name, schema, options) {
        if (schema.type === 'array' && schema.format === 'singlefile') {
          if (schema.pattern && schema.pattern.mimeType && !schema.pattern.validationMessage) {
            schema.pattern.validationMessage = defaultPatternMsg;
          }
          if (schema.maxSize && schema.maxSize.maximum && !schema.maxSize.validationMessage) {
            schema.maxSize.validationMessage  = defaultMaxSizeMsg1;
            schema.maxSize.validationMessage2 = defaultMaxSizeMsg2;
          }
          if (schema.minItems && !schema.minItemsValidationMessage) {
            schema.minItemsValidationMessage = defaultMinItemsMsg;
          }
          if (schema.maxItems && !schema.maxItemsValidationMessage) {
            schema.maxItemsValidationMessage = defaultMaxItemsMsg;
          }

          var f                                                  = schemaFormProvider.stdFormObj(name, schema, options);
          f.key                                                  = options.path;
          f.type                                                 = 'nwpFileUpload';
          options.lookup[sfPathProvider.stringify(options.path)] = f;
          return f;
        }
      };

      schemaFormProvider.defaults.array.unshift(nwpSinglefileUpload);

      var nwpMultifileUpload = function (name, schema, options) {
        if (schema.type === 'array' && schema.format === 'multifile') {
          if (schema.pattern && schema.pattern.mimeType && !schema.pattern.validationMessage) {
            schema.pattern.validationMessage = defaultPatternMsg;
          }
          if (schema.maxSize && schema.maxSize.maximum && !schema.maxSize.validationMessage) {
            schema.maxSize.validationMessage  = defaultMaxSizeMsg1;
            schema.maxSize.validationMessage2 = defaultMaxSizeMsg2;
          }
          if (schema.minItems && !schema.minItemsValidationMessage) {
            schema.minItemsValidationMessage = defaultMinItemsMsg;
          }
          if (schema.maxItems && !schema.maxItemsValidationMessage) {
            schema.maxItemsValidationMessage = defaultMaxItemsMsg;
          }

          var f                                                  = schemaFormProvider.stdFormObj(name, schema, options);
          f.key                                                  = options.path;
          f.type                                                 = 'nwpFileUpload';
          options.lookup[sfPathProvider.stringify(options.path)] = f;
          return f;
        }
      };

      schemaFormProvider.defaults.array.unshift(nwpMultifileUpload);

      schemaFormDecoratorsProvider.addMapping(
        'bootstrapDecorator',
        'nwpFileUpload',
        'directives/decorators/bootstrap/nwp-file/nwp-file.html'
      );
    }
  ]);

angular.module('schemaForm').directive(
  'ngFileCountValidator', [
    function() {
      return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
          var valid = scope.form.schema.maxItems ? (scope.model.images ? scope.model.images.length : 0) < scope.form.schema.maxItems : true;
          ngModel.$parsers.unshift(function(value) {
            ngModel.$setValidity('ngFileCountValidator', valid);
            return valid ? value : undefined;
          });

          ngModel.$formatters.unshift(function(value) {
            ngModel.$setValidity('ngFileCountValidator', valid);
            return valid ? value : undefined;
          });
        }
      }
    }
  ]
);

angular
   .module('ngSchemaFormFile', [
      'ngFileUpload',
      'ngMessages'
   ])
   .directive('ngSchemaFile', ['Upload', 'CookieService', '$timeout', '$q', function (Upload, CookieService, $timeout, $q) {
      return {
        restrict: 'A',
        scope:    true,
        require:  'ngModel',
        link:     function (scope, element, attrs, ngModel) {
          scope.url = scope.form && scope.form.endpoint;
          var token = CookieService.getToken();
          scope.isSinglefileUpload = scope.form && scope.form.schema && scope.form.schema.format === 'singlefile';

          scope.selectFile  = function (file) {
            scope.picFile = file;
          };
          scope.selectFiles = function (files) {
            scope.picFiles = files;
          };

          scope.uploadFile = function (file, schemaId) {
            file && doUpload(file, token, schemaId);
          };

          scope.uploadFiles = function (files, schemaId) {
            files.length && angular.forEach(files, function (file) {
              doUpload(file, token, schemaId);
            });
          };

          function doUpload(file, token, schemaId) {
            if ((scope.model.images ? scope.model.images.length : 0) + 1 > scope.form.schema.maxItems) {
              scope.uploadForm.$error.maxItems = true;
              file.$error = "maxItems";
              file.$errorParam = (scope.model.images ? scope.model.images.length : 0) + 1 + ". Datei, " + scope.form.schema.maxItems + " Dateien erlaubt.";
            }
            if (file && !file.$error && scope.url) {
              file.upload = Upload.upload({
                url:  scope.url,
                file: file,
                data: {
                  schemaId: schemaId,
                  path: scope.form.path
                },
                headers: {'X-Archibald-Token': token}
              });

              file.upload.then(function (response) {
                $timeout(function () {
                  file.result = response.data;
                });
                // first file on that property in record
                if (!ngModel.$viewValue) {
                  ngModel.$setViewValue([response.data]);
                // property already has files
                } else {
                  var found = false;
                  ngModel.$viewValue.forEach(function (file) {
                    if (file.filename == response.data.filename) { found = true; }
                  });
                  if (!found) {
                    ngModel.$viewValue.push(response.data);
                  }
                }
                ngModel.$commitViewValue();
                // empties fileinput for one file after being uploaded, timeout
                // to wait for progressbar to change before removing file through
                // animation from the filepicker
                $timeout(function () {
                  scope.picFiles.forEach(function (picFile) {
                    if (file.blobUrl == picFile.blobUrl) {
                      scope.picFiles.splice(scope.picFiles.indexOf(picFile),1);
                    }
                    scope.uploadForm.$setDirty();
                  });
                });
              }, function (response) {
                if (response.status > 0) {
                  scope.errorMsg = response.status + ': ' + response.data;
                }
              });

              file.upload.progress(function (evt) {
                file.progress = Math.min(100, parseInt(100.0 *
                  evt.loaded / evt.total));
              });
            }
          }

          // deletes a file from a record, the file and it's database entry are left
          // since that scenario is assumed to be unlikely and better dealt with in
          // future as of now
          scope.deleteFile = function (filename) {
            var files = [];
            ngModel.$viewValue.forEach(function (file) {
              if (file != filename) {
                files.push(file);
              }
            });
            ngModel.$setViewValue(files);
            if (scope.picFiles) {
              scope.picFiles.forEach(function (picFile) {
                if (picFile.$error == "maxItems") {
                  delete picFile.$error;
                  delete picFile.$errorParam;
                }
              });
            }
          }
        }
      };
  }]);
