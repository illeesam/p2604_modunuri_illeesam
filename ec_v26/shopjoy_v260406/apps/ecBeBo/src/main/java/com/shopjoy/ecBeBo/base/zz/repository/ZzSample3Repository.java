package com.shopjoy.ecadminapi.base.zz.repository;

import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSample3;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.shopjoy.ecadminapi.base.zz.repository.qrydsl.QZzSample3Repository;

@Repository
public interface ZzSample3Repository extends JpaRepository<ZzSample3, String>, QZzSample3Repository {
}
