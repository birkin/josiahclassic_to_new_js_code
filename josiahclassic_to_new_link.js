console.log( "- bib_link.js START" );


var biblink_flow_manager = new function() {
  /* Namespaces function calls.
   *
   * See <http://stackoverflow.com/a/881611> for module-pattern reference.
   * Minimizes chances that a function here will interfere with a similarly-named function in another imported js file.
   * Only check_already_run() can be called publicly, and only via ```biblink_flow_manager.check_already_run();```.
   *
   * Controller class flow description:
   * - Determines page-type. If bib page...
   *   - Grabs bib
   *   - Builds link html
   *   - Displays bib-link
   *
   * Reference Josiah pages:
   * - regular bib page: <https://josiah.brown.edu/record=b8042960>
   * - others?
   */

  /* set globals, essentially class attributes */
  var bibnum = null;
  var all_html = "";
  var new_josiah_url = "";
  var newjosiah_root_url = "https://search.library.brown.edu/catalog/";  // `b1234567` comes next

  this.check_already_run = function() {
    /* Checks to see if javascript has already been run.
     * Called by document.ready()
     */
    all_html = $("body").html().toString();  // jquery already loaded (whew)
    var index = all_html.indexOf( 'class="bib_link"' );
    if (index != -1) {
      console.log( "- bib_link to new-josiah aready run" );
    } else {
      console.log( "- bib_link to new-josiah not already run" );
      check_page_type();
    }
  }

  var check_page_type = function() {
    /* Checks if `PermaLink` is on page.
     * Called by check_already_run()
     */
    var index = all_html.indexOf( "PermaLink to this record" );
    if (index != -1) {
      console.log( "- on bib page" );
      grab_bib();
    }  else {
      console.log( "- not bib page; done" );
    }
  }

  var grab_bib = function() {
    /* Grabs bib via #recordnum; then continues processing.
     * Called by check_page_type()
     */
    var elmnt = document.querySelector( "#recordnum" );
    var url_string = elmnt.href;
    var segments = url_string.split( "=" )[1];
    bibnum = segments.slice( 0,8 );
    console.log( "- bibnum, " + bibnum );
    build_url();
  }

  var build_url = function() {
    /* Builds url.
     * Called by grab_bib()
     */
    var full_newjosiah_url = newjosiah_root_url + bibnum;
    console.log( "- full_newjosiah_url, " + full_newjosiah_url );
    build_link_html( full_newjosiah_url );
  }

  var build_link_html = function( full_newjosiah_url ) {
    /* Builds display html.
     * Called by build_url()
     */
    var a = document.createElement( "a" );
    a.href = full_newjosiah_url;
    a.setAttribute( "class", "bib_link" );
    a.setAttribute( "style", "color:red;" )
    a.setAttribute( "title", "additional services may be available for this item" );
    var link_text = document.createTextNode( "Request Services for this item" );
    a.appendChild( link_text );
    console.log( "- a object created" );
    attach_html( a );
  }

  var attach_html = function( a ) {
    /* Attaches object to DOM.
     * Called by build_link_html()
     */
    var permalink_element = document.querySelector( "#recordnum" );
    permalink_element.insertAdjacentElement( "afterend", a );
    permalink_element.insertAdjacentHTML( "afterend", '<br style="margin-bottom:10em;padding-bottom:10em"></br>' );
    console.log( "- link to new-josiah attached" )
  }

};  // end namespace biblink_flow_manager, ```var biblink_flow_manager = new function() {```



$(document).ready(
  function() {
    console.log( "- bib_link.js says document loaded" );
    biblink_flow_manager.check_already_run();
  }
);


console.log( "- bib_link.js END" );
