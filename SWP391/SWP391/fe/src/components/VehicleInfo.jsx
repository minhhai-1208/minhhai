import { useParams, useNavigate } from "react-router-dom";

// dữ liệu giống bên VehicleList (có thể tách ra file data.js)
import { vehicles } from "../data/vehicles";
import VehicleDetail from "../pages/dealer/VehicleDetail";

const VehicleInfo = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const vehicle = vehicles.find((v) => v.id === parseInt(id));

  if (!vehicle) return <p>Xe không tồn tại</p>;

  return (
    <VehicleDetail vehicle={vehicle} onBack={() => navigate("/vehicles")} />
  );
};

export default VehicleInfo;
