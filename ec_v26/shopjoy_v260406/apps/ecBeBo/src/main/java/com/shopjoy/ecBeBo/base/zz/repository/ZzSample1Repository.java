package com.shopjoy.ecadminapi.base.zz.repository;

import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSample1;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.shopjoy.ecadminapi.base.zz.repository.qrydsl.QZzSample1Repository;

@Repository
public interface ZzSample1Repository extends JpaRepository<ZzSample1, String>, QZzSample1Repository {
}
