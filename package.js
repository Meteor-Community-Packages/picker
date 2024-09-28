Package.describe({
  name: 'communitypackages:picker',
  summary: 'Server Side Router for Meteor',
  version: '2.0.0-beta.0',
  git: 'https://github.com/Meteor-Community-Packages/picker.git',
  documentation: 'README.md',
  deprecated: true
});

Npm.depends({
  'path-to-regexp': '6.2.2'
});

function configurePackage(api) {
  api.versionsFrom('METEOR@3.0.1');
  api.use(['webapp', 'ecmascript', 'url'], 'server');
}

Package.onUse(function(api) {
  configurePackage(api);
  api.mainModule('lib/instance.js', 'server');
});

Package.onTest(function(api) {
  configurePackage(api);
  api.use('communitypackages:picker', 'server');
  api.use(['meteortesting:browser-tests@1.7.0', 'meteortesting:mocha@3.2.0']);
  api.use(['fetch', 'random'], 'server');
  api.mainModule('test/instance.js', 'server');
});
