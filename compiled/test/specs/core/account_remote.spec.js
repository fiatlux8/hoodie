// Generated by CoffeeScript 1.4.0

describe("Hoodie.AccountRemote", function() {
  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie;
    spyOn(this.hoodie, "on");
    spyOn(this.hoodie, "one");
    spyOn(this.hoodie, "unbind");
    this.requestDefer = this.hoodie.defer();
    spyOn(this.hoodie, "request").andReturn(this.requestDefer.promise());
    spyOn(window, "setTimeout");
    spyOn(this.hoodie.account, "db").andReturn('userhash123');
    spyOn(this.hoodie, "trigger");
    spyOn(this.hoodie.store, "remove").andReturn({
      then: function(cb) {
        return cb('objectFromStore');
      }
    });
    spyOn(this.hoodie.store, "update").andReturn({
      then: function(cb) {
        return cb('objectFromStore', false);
      }
    });
    spyOn(this.hoodie.store, "save").andReturn({
      then: function(cb) {
        return cb('objectFromStore', false);
      }
    });
    return this.remote = new Hoodie.AccountRemote(this.hoodie);
  });
  describe("constructor(@hoodie, options = {})", function() {
    beforeEach(function() {
      return this.remote = new Hoodie.AccountRemote(this.hoodie);
    });
    it("should set name to users database name", function() {
      return expect(this.remote.name).toBe("userhash123");
    });
    it("should sync continously by default", function() {
      return expect(this.remote.isContinuouslySyncing()).toBeTruthy();
    });
    it("should start syncing", function() {
      spyOn(Hoodie.AccountRemote.prototype, "startSyncing");
      new Hoodie.AccountRemote(this.hoodie);
      return expect(Hoodie.AccountRemote.prototype.startSyncing).wasCalled();
    });
    return _when("config remote.sync is false", function() {
      beforeEach(function() {
        spyOn(this.hoodie.config, "get").andReturn(false);
        return this.remote = new Hoodie.AccountRemote(this.hoodie);
      });
      it("should set syncContinuously to false", function() {
        return expect(this.remote.isContinuouslySyncing()).toBe(false);
      });
      return it("should not start syncing", function() {
        spyOn(Hoodie.AccountRemote.prototype, "startSyncing");
        new Hoodie.AccountRemote(this.hoodie);
        return expect(Hoodie.AccountRemote.prototype.startSyncing).wasNotCalled();
      });
    });
  });
  describe("#startSyncing", function() {
    it("should make isContinuouslySyncing() to return true", function() {
      this.remote._sync = false;
      this.remote.startSyncing();
      return expect(this.remote.isContinuouslySyncing()).toBeTruthy();
    });
    it("should set config _remote.sync to true", function() {
      spyOn(this.hoodie.config, "set");
      this.remote.startSyncing();
      return expect(this.hoodie.config.set).wasCalledWith('_remote.sync', true);
    });
    it("should subscribe to `signout` event", function() {
      this.remote.startSyncing();
      return expect(this.hoodie.on).wasCalledWith('account:signout', this.remote.disconnect);
    });
    it("should subscribe to account:signin with sync", function() {
      this.remote.startSyncing();
      return expect(this.hoodie.on).wasCalledWith('account:signin', this.remote._handleSignIn);
    });
    return it("should connect", function() {
      spyOn(this.remote, "connect");
      this.remote.startSyncing();
      return expect(this.remote.connect).wasCalled();
    });
  });
  describe("#stopSyncing", function() {
    it("should set _remote.sync to false", function() {
      this.remote._sync = true;
      this.remote.stopSyncing();
      return expect(this.remote.isContinuouslySyncing()).toBeFalsy();
    });
    it("should set config remote.syncContinuously to false", function() {
      spyOn(this.hoodie.config, "set");
      this.remote.stopSyncing();
      return expect(this.hoodie.config.set).wasCalledWith('_remote.sync', false);
    });
    it("should unsubscribe from account's signin idle event", function() {
      this.remote.stopSyncing();
      return expect(this.hoodie.unbind).wasCalledWith('account:signin', this.remote._handleSignIn);
    });
    return it("should unsubscribe from account's signout idle event", function() {
      this.remote.stopSyncing();
      return expect(this.hoodie.unbind).wasCalledWith('account:signout', this.remote.disconnect);
    });
  });
  describe("#connect()", function() {
    beforeEach(function() {
      return spyOn(this.remote, "sync");
    });
    it("should authenticate", function() {
      spyOn(this.hoodie.account, "authenticate").andCallThrough();
      this.remote.connect();
      return expect(this.hoodie.account.authenticate).wasCalled();
    });
    return _when("successful", function() {
      beforeEach(function() {
        return spyOn(this.hoodie.account, "authenticate").andReturn({
          pipe: function(cb) {
            cb();
            return {
              fail: function() {}
            };
          }
        });
      });
      return it("should call super", function() {
        spyOn(Hoodie.Remote.prototype, "connect");
        this.remote.connect();
        return expect(Hoodie.Remote.prototype.connect).wasCalled();
      });
    });
  });
  describe("#disconnect()", function() {
    return it("should unsubscribe from stores's dirty idle event", function() {
      this.remote.disconnect();
      return expect(this.hoodie.unbind).wasCalledWith('store:idle', this.remote.push);
    });
  });
  describe("#getSinceNr()", function() {
    beforeEach(function() {
      return spyOn(this.hoodie.config, "get");
    });
    it("should use user's config to get since nr", function() {
      this.remote.getSinceNr();
      return expect(this.hoodie.config.get).wasCalledWith('_remote.since');
    });
    return _when("config _remote.since is not defined", function() {
      beforeEach(function() {
        return this.hoodie.config.get.andReturn(void 0);
      });
      return it("should return 0", function() {
        return expect(this.remote.getSinceNr()).toBe(0);
      });
    });
  });
  describe("#setSinceNr(nr)", function() {
    beforeEach(function() {
      return spyOn(this.hoodie.config, "set");
    });
    return it("should use user's config to store since nr persistantly", function() {
      this.remote.setSinceNr(100);
      return expect(this.hoodie.config.set).wasCalledWith('_remote.since', 100);
    });
  });
  describe("#pull()", function() {
    beforeEach(function() {
      this.remote.connected = true;
      return spyOn(this.remote, "request").andReturn(this.requestDefer.promise());
    });
    _when(".isContinuouslyPulling() is true", function() {
      beforeEach(function() {
        return spyOn(this.remote, "isContinuouslyPulling").andReturn(true);
      });
      it("should send a longpoll GET request to the _changes feed", function() {
        var method, path, _ref;
        this.remote.pull();
        expect(this.remote.request).wasCalled();
        _ref = this.remote.request.mostRecentCall.args, method = _ref[0], path = _ref[1];
        expect(method).toBe('GET');
        return expect(path).toBe('/_changes?include_docs=true&since=0&heartbeat=10000&feed=longpoll');
      });
      return it("should set a timeout to restart the pull request", function() {
        this.remote.pull();
        return expect(window.setTimeout).wasCalledWith(this.remote._restartPullRequest, 25000);
      });
    });
    _when(".isContinuouslyPulling() is false", function() {
      beforeEach(function() {
        return spyOn(this.remote, "isContinuouslyPulling").andReturn(false);
      });
      return it("should send a normal GET request to the _changes feed", function() {
        var method, path, _ref;
        this.remote.pull();
        expect(this.remote.request).wasCalled();
        _ref = this.remote.request.mostRecentCall.args, method = _ref[0], path = _ref[1];
        expect(method).toBe('GET');
        return expect(path).toBe('/_changes?include_docs=true&since=0');
      });
    });
    _when("request is successful / returns changes", function() {
      beforeEach(function() {
        var _this = this;
        return this.remote.request.andReturn({
          then: function(success) {
            _this.remote.request.andReturn({
              then: function() {}
            });
            return success(Mocks.changesResponse());
          }
        });
      });
      it("should remove `todo/abc3` from store", function() {
        this.remote.pull();
        return expect(this.hoodie.store.remove).wasCalledWith('todo', 'abc3', {
          remote: true
        });
      });
      it("should save `todo/abc2` in store", function() {
        this.remote.pull();
        return expect(this.hoodie.store.save).wasCalledWith('todo', 'abc2', {
          _rev: '1-123',
          content: 'remember the milk',
          done: false,
          order: 1,
          type: 'todo',
          id: 'abc2'
        }, {
          remote: true
        });
      });
      it("should trigger remote events", function() {
        spyOn(this.remote, "trigger");
        this.remote.pull();
        expect(this.remote.trigger).wasCalledWith('remove', 'objectFromStore');
        expect(this.remote.trigger).wasCalledWith('remove:todo', 'objectFromStore');
        expect(this.remote.trigger).wasCalledWith('remove:todo:abc3', 'objectFromStore');
        expect(this.remote.trigger).wasCalledWith('change', 'remove', 'objectFromStore');
        expect(this.remote.trigger).wasCalledWith('change:todo', 'remove', 'objectFromStore');
        expect(this.remote.trigger).wasCalledWith('change:todo:abc3', 'remove', 'objectFromStore');
        expect(this.remote.trigger).wasCalledWith('update', 'objectFromStore');
        expect(this.remote.trigger).wasCalledWith('update:todo', 'objectFromStore');
        expect(this.remote.trigger).wasCalledWith('update:todo:abc2', 'objectFromStore');
        expect(this.remote.trigger).wasCalledWith('change', 'update', 'objectFromStore');
        expect(this.remote.trigger).wasCalledWith('change:todo', 'update', 'objectFromStore');
        return expect(this.remote.trigger).wasCalledWith('change:todo:abc2', 'update', 'objectFromStore');
      });
      return _and(".isContinuouslyPulling() returns true", function() {
        beforeEach(function() {
          spyOn(this.remote, "isContinuouslyPulling").andReturn(true);
          return spyOn(this.remote, "pull").andCallThrough();
        });
        return it("should pull again", function() {
          this.remote.pull();
          return expect(this.remote.pull.callCount).toBe(2);
        });
      });
    });
    _when("request errors with 401 unauthorzied", function() {
      beforeEach(function() {
        var _this = this;
        this.remote.request.andReturn({
          then: function(success, error) {
            _this.remote.request.andReturn({
              then: function() {}
            });
            return error({
              status: 401
            }, 'error object');
          }
        });
        return spyOn(this.remote, "disconnect");
      });
      it("should disconnect", function() {
        this.remote.pull();
        return expect(this.remote.disconnect).wasCalled();
      });
      it("should trigger an unauthenticated error", function() {
        spyOn(this.remote, "trigger");
        this.remote.pull();
        return expect(this.remote.trigger).wasCalledWith('error:unauthenticated', 'error object');
      });
      _and("remote is pullContinuously", function() {
        return beforeEach(function() {
          return this.remote.pullContinuously = true;
        });
      });
      return _and("remote isn't pullContinuously", function() {
        return beforeEach(function() {
          return this.remote.pullContinuously = false;
        });
      });
    });
    _when("request errors with 401 unauthorzied", function() {
      beforeEach(function() {
        var _this = this;
        this.remote.request.andReturn({
          then: function(success, error) {
            _this.remote.request.andReturn({
              then: function() {}
            });
            return error({
              status: 401
            }, 'error object');
          }
        });
        return spyOn(this.remote, "disconnect");
      });
      it("should disconnect", function() {
        this.remote.pull();
        return expect(this.remote.disconnect).wasCalled();
      });
      it("should trigger an unauthenticated error", function() {
        spyOn(this.remote, "trigger");
        this.remote.pull();
        return expect(this.remote.trigger).wasCalledWith('error:unauthenticated', 'error object');
      });
      _and("remote is pullContinuously", function() {
        return beforeEach(function() {
          return this.remote.pullContinuously = true;
        });
      });
      return _and("remote isn't pullContinuously", function() {
        return beforeEach(function() {
          return this.remote.pullContinuously = false;
        });
      });
    });
    _when("request errors with 404 not found", function() {
      beforeEach(function() {
        var _this = this;
        return this.remote.request.andReturn({
          then: function(success, error) {
            _this.remote.request.andReturn({
              then: function() {}
            });
            return error({
              status: 404
            }, 'error object');
          }
        });
      });
      return it("should try again in 3 seconds (it migh be due to a sign up, the userDB might be created yet)", function() {
        this.remote.pull();
        return expect(window.setTimeout).wasCalledWith(this.remote.pull, 3000);
      });
    });
    _when("request errors with 500 oooops", function() {
      beforeEach(function() {
        var _this = this;
        return this.remote.request.andReturn({
          then: function(success, error) {
            _this.remote.request.andReturn({
              then: function() {}
            });
            return error({
              status: 500
            }, 'error object');
          }
        });
      });
      it("should try again in 3 seconds (and hope it was only a hiccup ...)", function() {
        this.remote.pull();
        return expect(window.setTimeout).wasCalledWith(this.remote.pull, 3000);
      });
      return it("should trigger a server error event", function() {
        spyOn(this.remote, "trigger");
        this.remote.pull();
        return expect(this.remote.trigger).wasCalledWith('error:server', 'error object');
      });
    });
    _when("request was aborted manually", function() {
      beforeEach(function() {
        var _this = this;
        return this.remote.request.andReturn({
          then: function(success, error) {
            _this.remote.request.andReturn({
              then: function() {}
            });
            return error({
              statusText: 'abort'
            }, 'error object');
          }
        });
      });
      return it("should try again when .isContinuouslyPulling() returns true", function() {
        spyOn(this.remote, "pull").andCallThrough();
        spyOn(this.remote, "isContinuouslyPulling").andReturn(true);
        this.remote.pull();
        expect(this.remote.pull.callCount).toBe(2);
        this.remote.pull.reset();
        this.remote.isContinuouslyPulling.andReturn(false);
        this.remote.pull();
        return expect(this.remote.pull.callCount).toBe(1);
      });
    });
    return _when("there is a different error", function() {
      beforeEach(function() {
        var _this = this;
        return this.remote.request.andReturn({
          then: function(success, error) {
            _this.remote.request.andReturn({
              then: function() {}
            });
            return error({}, 'error object');
          }
        });
      });
      return it("should try again in 3 seconds if .isContinuouslyPulling() returns false", function() {
        spyOn(this.remote, "isContinuouslyPulling").andReturn(true);
        this.remote.pull();
        expect(window.setTimeout).wasCalledWith(this.remote.pull, 3000);
        window.setTimeout.reset();
        this.remote.isContinuouslyPulling.andReturn(false);
        this.remote.pull();
        return expect(window.setTimeout).wasNotCalledWith(this.remote.pull, 3000);
      });
    });
  });
  describe("#sync(docs)", function() {
    beforeEach(function() {
      spyOn(this.remote, "push").andCallFake(function(docs) {
        return {
          pipe: function(cb) {
            return cb(docs);
          }
        };
      });
      return spyOn(this.remote, "pull");
    });
    return _when(".isContinuouslyPushing() returns true", function() {
      beforeEach(function() {
        return spyOn(this.remote, "isContinuouslyPushing").andReturn(true);
      });
      it("should bind to store:idle event", function() {
        this.remote.sync();
        return expect(this.hoodie.on).wasCalledWith('store:idle', this.remote.push);
      });
      return it("should unbind from store:idle event before it binds to it", function() {
        var order;
        order = [];
        this.hoodie.unbind.andCallFake(function(event) {
          return order.push("unbind " + event);
        });
        this.hoodie.on.andCallFake(function(event) {
          return order.push("bind " + event);
        });
        this.remote.sync();
        expect(order[0]).toBe('unbind store:idle');
        return expect(order[1]).toBe('bind store:idle');
      });
    });
  });
  describe("#push(docs)", function() {
    beforeEach(function() {
      this.pushDefer = this.hoodie.defer();
      return spyOn(Hoodie.Remote.prototype, "push").andReturn(this.pushDefer.promise());
    });
    return _when("no docs passed", function() {
      return it("should push changed documents from store", function() {
        spyOn(this.hoodie.store, "changedDocs").andReturn("changed_docs");
        this.remote.push();
        return expect(Hoodie.Remote.prototype.push).wasCalledWith("changed_docs");
      });
    });
  });
  describe("#on", function() {
    it("should namespace bindings with 'remote'", function() {
      this.remote.on('funk', 'check');
      return expect(this.hoodie.on).wasCalledWith('remote:funk', 'check');
    });
    return it("should namespace multiple events correctly", function() {
      var cb;
      cb = jasmine.createSpy('test');
      this.remote.on('super funky fresh', cb);
      return expect(this.hoodie.on).wasCalledWith('remote:super remote:funky remote:fresh', cb);
    });
  });
  describe("#one", function() {
    it("should namespace bindings with 'remote'", function() {
      this.remote.one('funk', 'check');
      return expect(this.hoodie.one).wasCalledWith('remote:funk', 'check');
    });
    return it("should namespace multiple events correctly", function() {
      var cb;
      cb = jasmine.createSpy('test');
      this.remote.one('super funky fresh', cb);
      return expect(this.hoodie.one).wasCalledWith('remote:super remote:funky remote:fresh', cb);
    });
  });
  return describe("#trigger", function() {
    return it("should namespace bindings with 'remote'", function() {
      this.remote.trigger('funk', 'check');
      return expect(this.hoodie.trigger).wasCalledWith('remote:funk', 'check');
    });
  });
});
