package com.shopjoy.ecadminapi.base.ec.dp.repository;

import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpPanelRepository;

import java.util.List;

public interface DpPanelRepository extends JpaRepository<DpPanel, String>, QDpPanelRepository {

}
