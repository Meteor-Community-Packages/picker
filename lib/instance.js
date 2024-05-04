import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { PickerImp } from './implementation';

Meteor.startup(() => {
  console.debug('communitypackages:picker has been deprecated! It is still fine to use with Meteor 2, but for Meteor 3 you can use the webapp package itself as it now has all the capabilities that Picker was made to compensate for.')
  console.debug('See the repository for more information: https://github.com/Meteor-Community-Packages/picker')
})

export const Picker = new PickerImp();
if (WebApp.rawExpressHandlers) {
  // Meteor 3
  WebApp.rawExpressHandlers.use(function(req, res, next) {
    Picker._dispatch(req, res, next);
  });
} else if (WebApp.rawConnectHandlers) {
  WebApp.rawConnectHandlers.use(function(req, res, next) {
    Picker._dispatch(req, res, next);
  });
}
