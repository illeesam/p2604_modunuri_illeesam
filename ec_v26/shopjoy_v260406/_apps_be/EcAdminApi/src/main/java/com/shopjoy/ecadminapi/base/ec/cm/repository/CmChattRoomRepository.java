package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmChattRoomRepository;

public interface CmChattRoomRepository extends JpaRepository<CmChattRoom, String>, QCmChattRoomRepository {
}
