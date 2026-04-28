import React, { useState, useEffect } from "react";
import { X, Loader } from "lucide-react";

/**
 * Worker Assignment Modal
 * 
 * Used by Main Admin to assign clients to workers/departments
 * This component should be added to the Working Field page
 * 
 * Usage:
 * <AssignWorkerModal 
 *   isOpen={showModal}
 *   clientId={selectedClientId}
 *   onClose={() => setShowModal(false)}
 *   onAssign={handleAssignment}
 * />
 */

const AssignWorkerModal = ({ isOpen, clientId, onClose, onAssign }) => {
  const [workers, setWorkers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchWorkersAndDepartments();
    }
  }, [isOpen]);

  const fetchWorkersAndDepartments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Fetch workers
      const workersResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/api/users?role=worker`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const workersData = await workersResponse.json();
      setWorkers(workersData);

      // Fetch departments
      const deptsResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/api/departments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const deptsData = await deptsResponse.json();
      setDepartments(deptsData);
    } catch (err) {
      setError("Failed to load workers and departments");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedWorker || !selectedDepartment) {
      setError("Please select both a worker and department");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/clients/${clientId}/assign-worker`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            workerId: selectedWorker,
            department: selectedDepartment,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to assign worker");
      }

      const result = await response.json();
      onAssign(result);
      onClose();
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Assign to Worker</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Department Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Select Department<span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedWorker(""); // Reset worker when department changes
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a department...</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Worker Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Select Worker<span className="text-red-500">*</span>
            </label>
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              disabled={!selectedDepartment}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">
                {selectedDepartment
                  ? "Choose a worker..."
                  : "Select department first"}
              </option>
              {selectedDepartment &&
                workers
                  .filter((w) => w.assignedDepartment === selectedDepartment)
                  .map((worker) => (
                    <option key={worker._id} value={worker._id}>
                      {worker.fullname}
                      {worker.assignedClients?.length > 0 && (
                        <span className="text-gray-500">
                          {" "}
                          ({worker.assignedClients.length} clients)
                        </span>
                      )}
                    </option>
                  ))}
            </select>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Once assigned, the worker will be able to
              see this client in their Working Field and communicate with them
              directly.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading || !selectedWorker || !selectedDepartment}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader size={18} className="animate-spin" />}
            Assign Worker
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignWorkerModal;

// ========= INTEGRATION EXAMPLE =========

/**
 * How to use this in Working Field component:
 * 
 * import AssignWorkerModal from "./AssignWorkerModal";
 * 
 * const WorkingField = () => {
 *   const [showAssignModal, setShowAssignModal] = useState(false);
 *   const [selectedClientId, setSelectedClientId] = useState(null);
 * 
 *   const handleAssignClick = (clientId) => {
 *     setSelectedClientId(clientId);
 *     setShowAssignModal(true);
 *   };
 * 
 *   const handleAssignment = (updatedClient) => {
 *     setClients(clients.map(c => 
 *       c._id === updatedClient._id ? updatedClient : c
 *     ));
 *     alert("Worker assigned successfully!");
 *   };
 * 
 *   Then add the modal to your JSX:
 *   <AssignWorkerModal
 *     isOpen={showAssignModal}
 *     clientId={selectedClientId}
 *     onClose={() => setShowAssignModal(false)}
 *     onAssign={handleAssignment}
 *   />
 */
