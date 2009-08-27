
clean:
	sed -i \
		-e 's|http://test.kraehen.org/|http://kraehen.org/|' \
		-e 's|http://localhost/|http://kraehen.org/|' \
		kraehenauge_ext.user.js

local:
	sed -i \
		-e 's|http://kraehen.org/|http://localhost/|' \
		-e 's|http://test.kraehen.org/|http://localhost/|' \
		kraehenauge_ext.user.js

test:
	sed -i \
		-e 's|http://kraehen.org/|http://test.kraehen.org/|' \
		-e 's|http://localhost/|http://test.kraehen.org/|' \
		kraehenauge_ext.user.js
