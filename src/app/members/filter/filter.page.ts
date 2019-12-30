import { Component, OnInit } from '@angular/core';
import { PopoverController, NavParams } from '@ionic/angular';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.page.html',
  styleUrls: ['./filter.page.scss'],
})
export class FilterPage implements OnInit {

  corporations = [];
  brands = [];
  portfolios = [];
  all = {id: "0x000000000000000000000000000000000000", name: "All Hotels", type: "corp"};

  userID;
  token;
  page;

  constructor(private popoverController: PopoverController, private storage: Storage, private navParams: NavParams) {}

  ngOnInit() {
    this.page = this.navParams.get("page");
    this.storage.get("corporations").then(res => {
      this.corporations = res;
    });
    if (this.page == "hotel-info") {
      this.storage.get("brands").then(res => {
        this.brands = res;
      });
    }
  }

  async closePopover(selected) {
    const onClosedData = {type: selected.type, id: selected.id, name: selected.name};
    await this.popoverController.dismiss(onClosedData);
  }
}
