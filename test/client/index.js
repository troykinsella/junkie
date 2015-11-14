
// Required environmental polyfills

if (!Object.assign) {
  Object.assign = require('object-assign');
}

// Integration testes

require('../integration/assignment-resolver-int-test');
require('../integration/caching-resolver-int-test');
require('../integration/constructor-resolver-int-test');
require('../integration/container-int-test');
require('../integration/creator-resolver-int-test');
require('../integration/decorator-resolver-int-test');
require('../integration/factory-method-resolver-int-test');
require('../integration/factory-resolver-int-test');
require('../integration/field-resolver-int-test');
require('../integration/freezing-resolver-int-test');
require('../integration/method-resolver-int-test');
require('../integration/multiple-resolvers-int-test');
require('../integration/optional-deps-int-test');
require('../integration/resolver-inheritance-int-test');

// Unit tests

require('../unit/component-test');
require('../unit/container-test');
require('../unit/dependency-test');
require('../unit/junkie-test');
