import Cookie from 'js-cookie';
import { oilOptIn } from '../../src/scripts/userview/userview_optin';
import * as CoreConfig from '../../src/scripts/core/core_config';
import * as CoreCookies from '../../src/scripts/core/core_cookies';
import * as CorePoi from '../../src/scripts/core/core_poi';
import { checkOptIn } from '../../src/scripts/core/core_optin';
import { resetOil } from '../test-utils/utils_reset';
import { setupVendorListSpies } from '../test-utils/utils_vendorlist';

describe('Opt-In', () => {

  beforeEach(() => resetOil());

  describe('without changes', () => {
    it('it should define default cookie', () => {
      expect(CoreCookies.getSoiCookie().opt_in).toBe(false);
    });

    it('should reset to default cookie if cookie name is not set to oil_data', () => {
      Cookie.set('oil_data2', {opt_in: false, optLater: false}, {expires: 31});
      expect(CoreCookies.getSoiCookie().opt_in).toBe(false);
    });

    it('should reset to default cookie if cookie keys are not matching', () => {
      Cookie.set('oil_data', {optin2: false, optLater2: false}, {expires: 31});
      expect(CoreCookies.getSoiCookie().opt_in).toBe(false);
    });
  });

  describe('oilOptIn', () => {
    it('should persist opt-in', (done) => {
      setupVendorListSpies();
      oilOptIn().then((optin) => {
        expect(optin).toBe(true);
        expect(CoreCookies.getSoiCookie().opt_in).toBe(true);
        done();
      });
    });
  });

  describe('opt in checker', () => {
    beforeEach(() => {
      spyOn(CoreCookies, 'setSoiCookieWithPoiCookieData').and.returnValue(new Promise((resolve) => resolve()));
    });

    it('should use the power opt-in for the single opt-in if single opt-in is not defined and power opt-in can be verified', (done) => {
      let singleOptIn = false;
      let powerOptIn = true;
      const poiCookieJson = {power_opt_in: powerOptIn, consentData: 'aConsentDataObject'};
      spyOn(CoreCookies, 'getSoiCookie').and.returnValue({opt_in: singleOptIn});
      spyOn(CorePoi, 'verifyPowerOptIn').and.returnValue(new Promise(resolve => resolve(poiCookieJson)));

      checkOptIn().then(resultOptIn => {
        expect(resultOptIn).toBe(powerOptIn);
        expect(CorePoi.verifyPowerOptIn).toHaveBeenCalled();
        expect(CoreCookies.setSoiCookieWithPoiCookieData).toHaveBeenCalledWith(poiCookieJson);
        done();
      });
    });

    it('should not try to set single opt-in if power opt-in cannot be verified', (done) => {
      let singleOptIn = false;
      let powerOptIn = false;
      spyOn(CoreCookies, 'getSoiCookie').and.returnValue({opt_in: singleOptIn});
      spyOn(CorePoi, 'verifyPowerOptIn').and.returnValue(new Promise(resolve => {
        resolve({power_opt_in: powerOptIn, consentData: 'aConsentDataObject'});
      }));

      checkOptIn().then(resultOptIn => {
        expect(resultOptIn).toBe(singleOptIn);
        expect(CorePoi.verifyPowerOptIn).toHaveBeenCalled();
        expect(CoreCookies.setSoiCookieWithPoiCookieData).not.toHaveBeenCalled();
        done();
      });
    });

    it('should not try to set single opt-in if power opt-in can be verified but single opt-in is already set', (done) => {
      let singleOptIn = true;
      let powerOptIn = true;
      spyOn(CoreCookies, 'getSoiCookie').and.returnValue({opt_in: singleOptIn});
      spyOn(CorePoi, 'verifyPowerOptIn').and.returnValue(new Promise(resolve => {
        resolve({power_opt_in: powerOptIn, consentData: 'aConsentDataObject'});
      }));

      checkOptIn().then(resultOptIn => {
        expect(resultOptIn).toBe(powerOptIn);
        expect(CorePoi.verifyPowerOptIn).toHaveBeenCalled();
        expect(CoreCookies.setSoiCookieWithPoiCookieData).not.toHaveBeenCalled();
        done();
      });
    });

  });

});
