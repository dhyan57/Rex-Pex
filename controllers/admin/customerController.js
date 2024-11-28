const User = require("../../models/userSchema");







const customerInfo = async (req, res) => {
    try {
        let search = req.query.search || "";
        let page = parseInt(req.query.page, 10) || 1;
        const limit = 3;

        // Fetch paginated and filtered users
        const userData = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } },
            ],
        })
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        // Total users count for pagination
        const count = await User.countDocuments({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } },
            ],
        });

        res.render("customer",{
            data: userData,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
        });
    } catch (error) {
        console.error("Error fetching customer data:", error);
        res.status(500).send("Internal Server Error");
    }
};

const customerBlocked=async(req,res)=>{
    try {
        
        const id = req.query.id;
        console.log(id);
        

        // Update the user's blocked status to true
        await User.updateOne({_id:id},{$set:{isBlocked:true}});

        res.redirect("/admin/users");
    } catch (error) {
        console.error("Error blocking customer:",error);
        res.redirect("/pageerror");
    }
};

const customerunBlocked=async(req,res)=>{
    try {
        const id = req.query.id;

        // Update the user's blocked status to false
        await User.updateOne({_id:id},{$set:{isBlocked:false}});

        res.redirect("/admin/users");
    } catch (error) {
        console.error("Error unblocking customer:",error);
        res.redirect("/pageerror");
    }
};




module.exports = {
    customerInfo,
    customerBlocked,
    customerunBlocked,
};

