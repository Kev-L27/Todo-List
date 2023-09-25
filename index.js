import express from "express";
import bodyParser from "body-parser";
import mongoose, { mongo } from "mongoose";
import _ from "lodash";

const app = express();
const port = 3000;
var workItems = [];

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

try{
	await mongoose.connect("mongodb+srv://admin-kevin:Bushiba,.999@atlascluster.tzbqwtv.mongodb.net/todoListDB")
} catch(err) {
	console.log("Error connecting to DB: " + err);
}

const listItemSchema = new mongoose.Schema({
	name: String
});
const customSchema = new mongoose.Schema({
	name: String,
	items: [listItemSchema]
});

const Item = mongoose.model("Item", listItemSchema);
const Custom = mongoose.model("Custom", customSchema);

const item1 = new Item({
	name: "Clean Room."
});
const item2 = new Item({
	name: "Do homework."
})
const item3 = new Item({
	name: "Buy butter."
})

const defaultItems = [item1, item2, item3];

async function InitializeList(){
	Item.insertMany(defaultItems)
		.then(() => {
			console.log("Successfully initialized default items to DB.");
		})
		.catch((err) => {
			console.log("Failed to insert default items: " + err);
		})
		/* .finally(() => {
			setTimeout(() => {
				mongoose.disconnect();
			}, 1000);
			console.log("Mongoose connection closed.");
		}) */
}



app.get("/", (req, res)=>{
	Item.find()
		.then((listItems) => {
			if (listItems.length === 0) {
				InitializeList();
				res.redirect("/");
			} else {
				res.render("index.ejs", {listTitle: "Today", listItems});
				console.log("Found all items.");
			}
		})
		.catch((err) => {
			console.log("Error finding items.");
		})	
});

app.get("/:customListName", (req, res) => {
	const customListName = _.capitalize(req.params.customListName);
	Custom.findOne({name: customListName})
		.then((results) => {
			if (!results){
				const customItem = new Custom({
					name: customListName,
					items: defaultItems
				})
				customItem.save()

				res.redirect("/" + customListName);
			} else {
				res.render("index.ejs", {listTitle: results.name, listItems: results.items});
			}
		})
		.catch((err) => {
			console.log("Error finding custom list: " + err);
		})
})

app.post("/submit", (req, res)=>{
	const itemName = req.body.newItem;
	const listName = req.body.newList;

	const insertItem = new Item({
		name: itemName
	});

	if (listName === "Today") {
		insertItem.save();
		res.redirect("/");
	} else {
		Custom.findOne({name: listName})
			.then((result) => {
				result.items.push(insertItem);
				result.save();
				res.redirect("/" + listName);
			})
			.catch((err) => {
				console.log("Error inserting item to custom list: " + err);
			})
	}	
});

app.post("/submitWork", (req, res)=>{
	workItems.push(req.body["newItem"]);
	res.render("work.ejs", {workItems});
});

app.post("/delete", (req, res)=>{
	const listName = req.body.RemoveList;

	if (listName === "Today"){
		Item.deleteMany()
		.then(() => {
			console.log("Succesfully deleted items.")
		})
		.catch((err) => {
			console.log("Deletion failed: " + err);
		})
		res.redirect("/");
	} else {
		Custom.findOne({name: listName})
			.then((result) => {
				result.items = defaultItems;
				result.save();
				res.redirect("/" + listName);
			})
			.catch((err) => {
				console.log("Error clearing list: " + err);
			})
	}
	
});

app.post("/deleteWork", (req, res)=>{
	workItems = [];
	res.render("work.ejs", {workItems});
});

app.post("/done", (req, res) => {
	const checkedId = req.body.checkbox;
	const listName = req.body.listName;

	if (listName === "Today"){
		Item.findByIdAndRemove(checkedId)
		.then(() => {
			console.log("Mission Accomplished.");
		})
		.catch((err) => {
			console.log("Error completing task: " + err);
		})
		res.redirect("/");
	} else {
		Custom.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedId}}})
			.then((result) => {
				res.redirect("/" + listName);
			})
			.catch((err) => {
				console.log("Error finishing up the task: " + err);
			})
	}
	
})

app.listen(port, ()=>{
	console.log("Listening on port 3000.");
});

function checkList(boxID, textContent){

}