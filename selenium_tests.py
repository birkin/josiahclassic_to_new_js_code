# -*- coding: utf-8 -*-

""" python3 tests for classic-josiah hay/aeon links

    Usage: $ python ./selenium_tests.py  # all tests
           $ python ./selenium_tests.py HayAeonlinkTest.test_HAY_STARR_very_long_title  # specific test

    Note: according to B.B., there is no plain 'HAY' location for an item.
    That's a bib-level location; all hay items should have a more specific location. """

import os, pprint, re, time, unittest
from urllib.parse import parse_qs, urlparse

from selenium import webdriver


class HayAeonlinkTest( unittest.TestCase ):
    """ Tests javascript-created Hay-Aeon links. """

    def setUp(self):
        self.driver = None
        driver_type = os.environ.get( 'HAYLINK_TESTS__DRIVER_TYPE', 'firefox' )
        if driver_type == 'firefox':
            self.driver = webdriver.Firefox()
        else:
            self.driver = webdriver.PhantomJS( '%s' % driver_type )  # will be path to phantomjs
        self.driver.implicitly_wait( 30 )
        self.base_url = os.environ.get( 'HAYLINK_TESTS__BASE_URL', 'http://josiah.brown.edu:2082' )
        # print( 'base_url, ```%s```' % self.base_url )

    def tearDown(self):
        self.driver.quit()

    ## presence tests

    def test_HAY_BROADSIDES_single_result( self ):
        """ Checks for link and link param-values for `HAY BROADSIDES` location. """
        driver = self.driver
        driver.get( self.base_url + '/record=b3326323' )
        ## check for single request link on page
        request_link_elements = driver.find_elements_by_link_text( 'Request' )
        self.assertEqual( 1, len(request_link_elements) )
        ## click the url
        driver.find_element_by_link_text( 'Request' ).click()
        # print( 'driver.current_url, ```%s```' % driver.current_url )
        ## check destination host
        url_obj = urlparse( driver.current_url )
        self.assertEqual( 'brown.aeon.atlas-sys.com', url_obj.netloc )
        # self.assertTrue( 'aeon' in driver.current_url )
        ## check params
        self.assertTrue( 'ReferenceNumber=b3326323' in driver.current_url )
        self.assertTrue( 'A%20letter%20of%20Thomas%20Jefferson%20to%20James%20Ronaldson%20on%20printing%20type%20%26%20human%20progress' in driver.current_url )
        self.assertTrue( 'ItemAuthor=Jefferson%2C%20Thomas%2C%201743-1826' in driver.current_url )
        self.assertTrue( 'ItemPublisher=%5BNew%20York%2C%20N.Y.%5D%20%3A%20American%20Printing%20History%20Association%2C%20%5B2003%5D' in driver.current_url )
        self.assertTrue( 'CallNumber=B7123%20NY' in driver.current_url )
        self.assertEqual( 'ItemInfo2=', driver.current_url[-10:] )

    def test_HAY_BROADSIDES_multiple_results( self ):
        """ Checks that a bib page with multiple `HAY BROADSIDE` items has multiple unique Request links. """
        driver = self.driver
        url = self.base_url + '/record=b3000585'
        driver.get( url )
        ## check for multiple Request links on page
        request_link_elements = driver.find_elements_by_link_text( 'Request' )
        self.assertEqual( 2, len(request_link_elements) )
        ## check callnumber in first link
        driver.get( url )
        driver.find_elements_by_link_text( 'Request' )[0].click()
        q_dct = parse_qs( driver.current_url )
        self.assertEqual( ['B6835 VA'], q_dct['CallNumber'] )
        ## check callnumber in second link
        driver.get( url )
        driver.find_elements_by_link_text( 'Request' )[1].click()
        q_dct = parse_qs( driver.current_url )
        self.assertEqual( ['B6835 VA c.2'], q_dct['CallNumber'] )

    def test_HAY_STARR_very_long_title( self ):
        """ Checks link prepared for item with very long title which should be truncated.
            If the full url to Aeon is too long, the handoff to Aeon will fail. """
        driver = self.driver
        driver.get( self.base_url + '/record=b1001443' )
        driver.find_element_by_link_text( 'Request' ).click()
        url_obj = urlparse( driver.current_url )
        q_dct = parse_qs( driver.current_url )
        # print( 'q_dct, ```%s```' % pprint.pformat(q_dct) )
        self.assertEqual(
            'brown.aeon.atlas-sys.com',
            url_obj.netloc )
        self.assertEqual(
            ['b1001443'],
            q_dct['ReferenceNumber'] )
        self.assertEqual(
            ['Thomas Jefferson offers his library to the Congress. A facsimile of the original letter in the University of Chicago Library, issued on the occasion of the dedication of the Joseph Regenstein Libra...'],
            q_dct['ItemTitle'] )
        self.assertEqual(
            ['Jefferson, Thomas, 1743-1826'],
            q_dct['ItemAuthor'] )
        self.assertEqual(
            ['[Chicago, 1970]'],
            q_dct['ItemPublisher'] )
        self.assertEqual(
            ['1-SIZE Z733.U57 J4 1812a'],
            q_dct['CallNumber'] )
        self.assertEqual(
            None,
            q_dct.get('ItemInfo2', None) )

    ## exclusion tests (no 'Request' link should appear)

    def test_HAY_MANUSCRIPTS_multiple_results( self ):
        """ Checks that no Aeon 'Request' button exists for excluded `HAY MANUSCRIPTS` location. """
        driver = self.driver
        driver.get( self.base_url + '/record=b3589814' )
        ## confirm multiple Hay links exist
        request_link_elements = driver.find_elements_by_link_text( 'HAY MANUSCRIPTS' )
        self.assertEqual( 10, len(request_link_elements) )
        ## check for single request link on page
        driver.implicitly_wait( 3 )  # seconds
        request_link_elements = driver.find_elements_by_link_text( 'Request' )
        self.assertEqual( 0, len(request_link_elements) )

    # def test__HAY_X_with_digital_version( self ):
    #     """ Checks for link and link param-values for HAY_X location but where item has digital online version.
    #         This test is commented out because it's really a JCB test that could be repurposed if an appropriate Hay item surfaces. """
    #     driver = self.driver
    #     driver.get( self.base_url + '/record=b2225840~S6' )
    #     driver.find_element_by_link_text( 'Request' ).click()
    #     self.assertTrue( 'aeon' in driver.current_url )
    #     self.assertTrue( 'ReferenceNumber=b2225840' in driver.current_url )
    #     self.assertTrue( 'ItemTitle=Argonautica' in driver.current_url )
    #     self.assertTrue( 'ItemAuthor=Usselincx' in driver.current_url )
    #     self.assertTrue( 'ItemPublisher=Gedruckt' in driver.current_url )
    #     self.assertTrue( 'CallNumber=1-SIZE' in driver.current_url )
    #     # self.assertTrue( 'Notes=(bibnum%3A%20b2225840)' in driver.current_url )
    #     self.assertTrue( 'ItemInfo2=https' in driver.current_url )

    ## end class HayAeonlinkTest


if __name__ == '__main__':
    runner = unittest.TextTestRunner()
    unittest.main( verbosity=2, warnings='ignore' )  # python3; warnings='ignore' from <http://stackoverflow.com/a/21500796>
