import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { Router, RouterEvent } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  selectedPath = '';
 
  pages = [
    {
      title: 'Dashboard',
      url: '/members/dashboard/hotel-info'
    },
    {
      title: 'Payment Approvals',
      url: '/members/dashboard/payments'
    }
  ];
  userID;
  token;
  domain;

  constructor(private authService: AuthenticationService, private router: Router, private storage: Storage, public http: HttpClient) {
    this.router.events.subscribe((event: RouterEvent) => {
      if (event && event.url) {
        this.selectedPath = event.url;
      }
    });
  }

  ngOnInit() {
    this.getAllCorporations();
    this.getAllBrands();
    this.storage.set("selectedCorp", {name: "All Hotels", id: "0x000000000000000000000000000000000000"});
  }

  logout() {
    this.authService.logout();
  }

  getAllCorporations() {
    // get userID and token
    this.storage.get("userID").then(res => {
      this.userID = res;
      this.storage.get("auth-token").then(res2 => {
        this.token = res2;
        this.storage.get("domain").then(res3 => {
          this.domain = res3;
          // get all corporations
          var url = 'https://mobileapi.nimbleproperty.net/api/Data/CorpInfo';
          var data = {
            UserID: this.userID,
            Domain: this.domain
          }
          let httpHeaders = new HttpHeaders({
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'UserID': this.userID,
            'Token': this.token,
            'Domain': this.domain,
            'MyClientCert': '',        
            'MyToken': ''
          });
          let options = {
            headers: httpHeaders
          };
          this.http.post(url, data, options).subscribe((response) => {
            var corporations = [];
            for (var key in response) {
              corporations.push(response[key]);
            }
            corporations.forEach(function(element) { element.type = "corp"; });
            for(var i = 0; i < corporations.length; i++) {
              corporations[i].id = corporations[i].corporationID;
              delete corporations[i].corporationID;
              corporations[i].name = corporations[i].corporationName;
              delete corporations[i].corporationName;
            }
            this.storage.set("corporations", corporations);
            console.log(corporations);
          });
        });
      });
    });
  }

  getAllBrands() {
    // get userID and token
    this.storage.get("userID").then(res => {
      this.userID = res;
      this.storage.get("auth-token").then(res2 => {
        this.token = res2;
        this.storage.get("domain").then(res3 => {
          this.domain = res3;
          // get all brands
          var url = 'https://mobileapi.nimbleproperty.net/api/Data/BrandInfo';
          var data = {
            UserID: this.userID,
            Domain: this.domain
          }
          let httpHeaders = new HttpHeaders({
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'UserID': this.userID,
            'Token': this.token,
            'Domain': this.domain,
            'MyClientCert': '',        
            'MyToken': ''
          });
          let options = {
            headers: httpHeaders
          };
          this.http.post(url, data, options).subscribe((response) => {
            var brands = [];
            for (var key in response) {
              brands.push(response[key]);
            }
            brands.forEach(function(element) { element.type = "brand"; });
            for(var i = 0; i < brands.length; i++) {
              brands[i].id = brands[i].brandID;
              delete brands[i].brandID;
              brands[i].name = brands[i].brandName;
              delete brands[i].brandName;
            }
            this.storage.set("brands", brands);
          });
        });
      });
    });
  }
}
