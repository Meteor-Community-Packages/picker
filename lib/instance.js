import { WebApp } from 'meteor/webapp';
import { PickerImp } from './implementation';

export const Picker = new PickerImp();
WebApp.handlers.use(async function(req, res, next) {
  await Picker._dispatch(req, res, next);
});
