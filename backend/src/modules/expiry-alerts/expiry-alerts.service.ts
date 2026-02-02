import prisma from "../../config/database.js";


export const createExpiryAlert = async (data: any) => {
  const expiryDate = new Date(data.expiry_date);

  const days_to_expiry = Math.ceil(
    (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return prisma.expiry_alerts.create({
    data: {
      ...data,

      days_to_expiry,
      status: "Active",
      reminders_sent: 0,
      renewal_process_started: false,
    },
  });
};

export const getExpiryAlerts = async() => {
    return prisma.expiry_alerts.findMany({
        orderBy: {
        expiry_date: 'asc',
        }
    })
};

export const updateExpiryAlert = async (id: string, data: any) => {
    const updateData: any = {
        ...data,
        updated_at: new Date(),
    };

    if (data.renewal_process_strated === true){
        updateData.renewal_process_started = true;
        updateData.status = "Under_Process";
    }

    if (data.status === "Renewed"){
        updateData.resolved_at = new Date();
    }

    return prisma.expiry_alerts.update({
        where: {id},
        data : updateData,
    })
}
