
clean: nodebug
	sed -i \
		-e 's|http://test.kraehen.org/|http://kraehen.org/|' \
		-e 's|http://localhost/|http://kraehen.org/|' \
		kraehenauge_extern.user.js

debug:
	sed -i \
		-e 's|var DEBUG = false;|var DEBUG = true;|' \
		-e 's|//sendDataWrapper("save?|sendDataWrapper("save?|' \
		kraehenauge_extern.user.js

nodebug:
	sed -i \
		-e 's|var DEBUG = true;|var DEBUG = false;|' \
		-e 's| sendDataWrapper("save?| //sendDataWrapper("save?|' \
		kraehenauge_extern.user.js

local: debug
	sed -i \
		-e 's|http://kraehen.org/|http://localhost/|' \
		-e 's|http://test.kraehen.org/|http://localhost/|' \
		kraehenauge_extern.user.js

test: nodebug
	sed -i \
		-e 's|http://kraehen.org/|http://test.kraehen.org/|' \
		-e 's|http://localhost/|http://test.kraehen.org/|' \
		kraehenauge_extern.user.js

regress: local nodebug
	cd regress; exec ./test.sh

test-regress: test
	cd regress; exec ./test.sh
