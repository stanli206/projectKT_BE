import Customer from "../Models/Customer.model.js";
import { v4 as uuidv4 } from "uuid";
import Project from "../Models/Project.model.js";

let custCounter = 1; // simple counter; replace with DB counter for production

export const createCustomer = async (req, res) => {
  try {
    const { Cust_name, Cust_address } = req.body;
    const Cust_code = String(custCounter++).padStart(4, "0");

    const cust = new Customer({
      Customer_id: uuidv4(),
      Cust_name,
      Cust_address,
      Cust_code,
      createdBy: req.user?.userId,
    });
    await cust.save();
    res.status(201).json(cust);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllCustomers = async (req, res) => {
  try {
    const list = await Customer.find();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const cust = await Customer.findOneAndUpdate(
      { Customer_id: req.params.id },
      { ...req.body, updatedBy: req.user?.userId, updatedAt: new Date() },
      { new: true }
    );
    if (!cust) return res.status(404).json({ message: "Not found" });
    res.json(cust);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// export const deleteCustomer = async (req, res) => {
//   try {
//     await Customer.findOneAndDelete({ Customer_id: req.params.id });
//     res.json({ message: "Deleted" });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Accept either Customer_id OR Cust_code in the URL
    const customer = await Customer.findOne({
      $or: [{ Customer_id: id }, { Cust_code: id }],
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Prevent deletion if any projects are linked to this customer
    const linkedProjects = await Project.countDocuments({
      "Pro_code.customerCode": customer.Cust_code,
    });

    if (linkedProjects > 0) {
      return res.status(409).json({
        message: `Cannot delete: ${linkedProjects} project(s) linked to customer ${customer.Cust_code}`,
      });
    }

    await Customer.deleteOne({ _id: customer._id });

    return res.json({
      message: "Deleted",
      Customer_id: customer.Customer_id,
      Cust_code: customer.Cust_code,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
