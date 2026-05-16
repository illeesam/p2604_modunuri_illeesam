package com.shopjoy.ecadminapi.base.zz.repository;

import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSample2;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.shopjoy.ecadminapi.base.zz.repository.qrydsl.QZzSample2Repository;

@Repository
public interface ZzSample2Repository extends JpaRepository<ZzSample2, String>, QZzSample2Repository {
}
