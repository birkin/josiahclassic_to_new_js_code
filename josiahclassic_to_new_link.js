console.log( "- hay_link.js START" );


var haylink_flow_manager = new function() {
  /* Namespaces function calls.
   *
   * See <http://stackoverflow.com/a/881611> for module-pattern reference.
   * Minimizes chances that a function here will interfere with a similarly-named function in another imported js file.
   * Only check_already_run() can be called publicly, and only via ```haylink_flow_manager.check_already_run();```.
   *
   * Controller class flow description:
   * - Determines page-type. If bib page...
   *   - Attempts to grab data elements. Then for each row...
   *   - Builds Aeon link
   *   - Builds link html
   *   - Displays Aeon link
   *
   * Reference Josiah pages:
   * - `HAY BROADSIDES` - regular: <http://josiah.brown.edu/record=b3326323>
   * - `HAY BROADSIDES` - multiple 'HAY BROADSIDES' copies: <http://josiah.brown.edu/record=b3000585>
   * - `HAY STAR & HAY LINCOLN` - multiple copies, mixture of two: <http://josiah.brown.edu/record=b1870356>
   * - `HAY STAR` - very-long-title handling: <http://josiah.brown.edu/record=b1001443>
   */

  /* set globals, essentially class attributes */
  var bibnum = null;
  var all_html = "";
  var title = "";
  var author = "";
  var publish_info = "";
  var callnumber = "";
  var digital_version_url = "";
  var bib_items_entry_rows = null;
  var bib_items_entry_row = null;
  // var aeon_root_url = "https://brown.aeon.atlas-sys.com/logon/?Action=10&Form=30";
  var full_aeon_url = "";

  this.check_already_run = function() {
    /* Checks to see if javascript has already been run.
     * Called by document.ready()
     */
    all_html = $("body").html().toString();  // jquery already loaded (whew)
    var index = all_html.indexOf( 'class="hay_link"' );
    if (index != -1) {
      console.log( "- aready run" );
    } else {
      console.log( "- not already run" );
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
      check_location();
    }  else {
      console.log( "- not bib page; done" );
    }
  }

  var check_location = function() {
    /* Checks if any of the locations are Hay-relevant.
     * Called by check_page_type()
     */
    bib_items_entry_rows = document.querySelectorAll( ".bibItemsEntry" );
    var hay_found = search_location_rows();
    if ( hay_found == true ) {
        console.log( "- Hay bib found; proceeding" );
        grab_bib();
    } else {
        console.log( "- not Hay bib page; done" );
    }
  }

  var search_location_rows = function() {
    /* Iterates through the bibItemsEntry rows, looking for valid HAY locations.
     * Returns boolean.
     * Called by check_location()
     */
    var hay_found = false;
    // var non_aeon_locations = [
    //   "HAY ANNEX TEMP", "HAY ARCHIVES MANUSCRIPTS", "HAY COURSE RESERVES", "HAY MANUSCRIPTS" ];
    var non_aeon_locations = hay_aeon_exclusions;  // global var from `https://github.com/Brown-University-Library/hay_aeon_exclusions`
    for( var i=0; i < bib_items_entry_rows.length; i++ ) {
      row = bib_items_entry_rows[i];
      if ( check_hay( row, non_aeon_locations ) == true ) {
        hay_found = true;
        break;
      }
    }
    return hay_found;
  }

  var check_hay = function( row, non_aeon_locations ) {
    /* Checks row for valid HAY location.
     * Returns boolean.
     * Called by search_location_rows()
     */
    var hay_found = false;
    var josiah_location = row.children[0].textContent.trim();
    console.log( "- current josiah_location, `" + josiah_location + "`" );
    if ( josiah_location.slice(0, 3) == "HAY" ){
      console.log( "- seeing HAY slice" );
      var index_of_val = non_aeon_locations.indexOf( josiah_location );
      console.log( "- indexOf(josiah_location) was `" + index_of_val + "`" );
      if ( index_of_val == -1 ) {
        console.log( "- hay_found is `true`" );
        hay_found = true;
      }
    }
    return hay_found;
  }

  var grab_bib = function() {
    /* Grabs bib via #recordnum; then continues processing.
     * Called by check_location()
     */
    var elmnt = document.querySelector( "#recordnum" );
    var url_string = elmnt.href;
    var segments = url_string.split( "=" )[1];
    bibnum = segments.slice( 0,8 );
    console.log( "- bibnum, " + bibnum );
    grab_bib_info();
  }

  var grab_bib_info = function() {
    /* Grabs bib-info from bibInfoEntry class; then continues processing.
     * Called by grab_bib()
     */
    var main_bib_entry = document.querySelectorAll( ".bibInfoEntry" )[0];
    var labels = document.querySelectorAll( "td.bibInfoLabel" );
    for( var i=0; i < labels.length; i++ ) {
      var label = labels[i];
      grab_title( label );
      grab_author( label );
      grab_publish_info( label );
      if ( title != "" && author != "" && publish_info != "" ) { break; }
    }
    check_online_link();
    process_rows();
  }

  var grab_title = function( label ) {
    /* Sets class title attribute, truncated to avoid errors with loooong titles.
     * Called by grab_bib_info()
     */
    if ( title == "" ) {
      var label_text = label.textContent.trim();
      if ( label_text == "Title" ) {
        title = label.nextElementSibling.textContent.trim();
        var max_length = 200;
        title = title.length > max_length ?
            title.substring(0, max_length - 3) + "..." :
            title.substring(0, max_length);
        console.log( "- title, " + title );
      }
    }
  }

  var grab_author = function( label ) {
    /* Sets class author attribute.
     * Called by grab_bib_info()
     */
    if ( author == "" ) {
      var label_text = label.textContent.trim();
      if ( label_text == "Author" ) {
        author = label.nextElementSibling.textContent.trim();
        console.log( "- author, " + author );
      }
    }
  }

  var grab_publish_info = function( label ) {
    /* Sets class publish_info attribute.
     * Called by grab_bib_info()
     */
    if ( publish_info == "" ) {
      var label_text = label.textContent.trim();
      if ( label_text == "Published" ) {
        publish_info = label.nextElementSibling.textContent.trim();
        console.log( "- publish_info, " + publish_info );
      }
    }
  }

  var check_online_link = function() {
    /* Checks for & grabs online link.
     * Called by grab_bib_info()
     */
    var bib_links = document.getElementsByClassName( "bibLinks" );
    if ( bib_links.length > 0 ) {
      var bib_link_text = bib_links[0].textContent;
      var index = bib_link_text.indexOf( "Digital Version" );
      if (index != -1) {
        var link = bib_links[0].getElementsByTagName( "a" )[0];
        digital_version_url = link.href;
      }
    }
    console.log( "- digital_version_url, " + digital_version_url );
  }

  // var process_rows = function() {
  //   /* For each row, calls a `haylink_row_processor` function to:
  //    *   - grab the row's callnumber
  //    *   - assemble the hay link html & display it
  //    * Called by grab_bib()
  //    * Ends `haylink_flow_manager` processing.
  //    */
  //   for( var i=0; i < bib_items_entry_rows.length; i++ ) {
  //       var row = bib_items_entry_rows[i];
  //       console.log( '- calling row-processor' );
  //       haylink_row_processor.process_item( row, bibnum, title, author, publish_info, digital_version_url );
  //   }
  // }

  var process_rows = function() {
    /* For each row, calls a `haylink_row_processor` function to:
     *   - grab the row's callnumber
     *   - assemble the hay link html & display it
     * Called by grab_bib()
     * Ends `haylink_flow_manager` processing.
     */
    for( var i=0; i < bib_items_entry_rows.length; i++ ) {
        var row = bib_items_entry_rows[i];
        // var josiah_location = row.children[0].textContent.trim();
        // console.log( "- josiah_location, ```" + josiah_location + "```" );
        console.log( '- calling row-processor' );
        haylink_row_processor.process_item( row, bibnum, title, author, publish_info, digital_version_url );
    }
  }

};  // end namespace haylink_flow_manager, ```var haylink_flow_manager = new function() {```


var haylink_row_processor = new function() {
  /*
   * Class flow description:
   *   - Determines whether to show an `HAY` Request link
   *   - If so, grabs callnumber
   *   - Builds and displays `HAY` Request link html
   */

  var local_row = null;
  var local_location = null;
  var callnumber = null;
  var bibnum = null;
  var local_title = null;
  var local_author = null;
  var local_publish_info = null;
  var local_digital_version_url = null;
  var aeon_root_url = "https://brown.aeon.atlas-sys.com/logon/?Action=10&Form=30";

  this.process_item = function( row, bibnum, title, author, publish_info, digital_version_url ) {
    /* Processes each row.
     * Called by haylink_flow_manager.process_rows()
     */
    console.log( '- processing row' );
    init_processor( row, bibnum, title, author, publish_info, digital_version_url );
    var hay_found = check_row_location();
    if ( hay_found == true ) {
      grab_callnumber();
      build_url();
    }
  }

  var init_processor = function( row, bibnum, title, author, publish_info, digital_version_url ) {
    /* Sets class attributes.
     * Called by process_item()
     */
    local_row = row;
    local_bibnum = bibnum;
    local_title = title;
    local_author = author;
    local_publish_info = publish_info;
    local_digital_version_url = digital_version_url;
  }

  var check_row_location = function() {
    /* Checks for HAY location.
     * Returns boolean.
     * Called by process_item()
     */
    var hay_found = false;
    // var josiah_location = local_row.children[0].textContent.trim();
    local_location = local_row.children[0].textContent.trim();
    console.log( "- row local_location, `" + local_location + "`" );
    if ( local_location.slice(0, 3) == "HAY" ) {
        hay_found = true;
    }
    console.log( "- hay_found, `" + hay_found + "`" );
    return hay_found;
  }

  var grab_callnumber = function() {
    /* Sets class call_number attribute.
     * Called by process_item()
     */
    var td = local_row.children[1];
    for( var i=0; i < td.childNodes.length; i++ ) {
      var elmnt = td.childNodes[i];
      if ( elmnt.nodeType == Node.COMMENT_NODE ) {
        if ( elmnt.textContent.trim() == "field C" ) {
          callnumber = td.textContent.trim();
          console.log( "- callnumber, " + callnumber );
          break;
        }
      }
    }
  }

  var build_url = function() {
    /* Builds proper url for class attribute.
     * Called by process_item()
     */
    var full_aeon_url = aeon_root_url +
      "&ReferenceNumber=" + local_bibnum +
      "&ItemTitle=" + encodeURIComponent( local_title ) +
      "&ItemAuthor=" + encodeURIComponent( local_author ) +
      "&ItemPublisher=" + encodeURIComponent( local_publish_info ) +
      "&CallNumber=" + encodeURIComponent( callnumber ) +
      "&Location=" + encodeURIComponent( local_location ) +
      "&ItemInfo2=" + encodeURIComponent( local_digital_version_url )
      ;
    console.log( "- full_aeon_url, " + full_aeon_url );
    display_link( full_aeon_url );
  }

  var display_link = function( full_aeon_url ) {
    /* Displays link html.
     * Called by build_url()
     * Ends `haylink_row_processor` processing.
     */
    console.log( "- starting display_link()" );
    var td = local_row.children[0];
    var dashes = document.createTextNode( " -- " );
    var a = document.createElement( "a" );
    a.href = full_aeon_url;
    a.setAttribute( "class", "hay_link" );
    var link_text = document.createTextNode( "Request" );
    a.appendChild( link_text );
    td.appendChild( dashes );
    td.appendChild( a );
    console.log( "- request-scan link added" );
  }

};  // end namespace haylink_row_processor, ```var haylink_row_processor = new function() {```




$(document).ready(
  function() {
    console.log( "- hay_link.js says document loaded" );
    haylink_flow_manager.check_already_run();
  }
);


console.log( "- hay_link.js END" );
