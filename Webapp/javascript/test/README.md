To use this, you need two files. 

	test.js, test.html

Copy the html file already here and change the js file it reliest on.
Then, open the file **directly in your browser** (i.e. not through
the node server!)

Should show the tests you have. If you find that your JS has dependencies,
then you also need to add them to the test.html file (so, for example,
jquery is already included with a `<script>` tag).

You also need to do (**in the backend directory**):

	sudo npm install chai mocha


