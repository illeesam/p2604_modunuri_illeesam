package com.shopjoy.ecadminapi.md.cb.repository;

import com.shopjoy.ecadminapi.md.cb.data.entity.MdCbSymbol;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.md.cb.repository.qrydsl.QMdCbSymbolRepository;

public interface MdCbSymbolRepository extends JpaRepository<MdCbSymbol, String>, QMdCbSymbolRepository {
}
