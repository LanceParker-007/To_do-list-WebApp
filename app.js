//jshint esversion:6
const express = require('express');
const bodyParser = require('body-parser');
// const ejs = require('ejs');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs'); // Use ejs as it's new engine

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-harsh:todolist123@cluster0.fpehk.mongodb.net/todolistDB", { useNewUrlParser: true });

const itemsSchema = new mongoose.Schema({ //First schema is created then model
    name: String
});

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to aff a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});


const defaultItems = [item1, item2, item3];
//-------------------------------------------------------
const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {

    Item.find({}, function (err, foundItems) {

        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log("Errrooo : " + err + " rrrr");
                } else {
                    console.log("Successfully saved default items to DB.");
                }
            });
            res.redirect("/");
        } else {
            res.render('list', { listTitle: "Today", newListItems: foundItems });
        }
    });

});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }, function (err, foundList) {
        if (err) {
            console.log("customListName " + err);
        } else {
            if (!foundList) {
                //console.log("Does not exist!"); // Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save();
                res.redirect("/" + customListName);
            } else {
                // console.log("Exist"); // Show the existing list
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
            }
        }
    })

});

app.post("/", function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    })

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (!err) {
                console.log("Successfully deleted");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }

});

app.listen(process.env.PORT || 3000, function () {
    console.log("Server started on port successfully!");
});