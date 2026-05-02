package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendor;
import com.shopjoy.ecadminapi.base.sy.mapper.SyVendorMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class BoSyVendorService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final SyVendorMapper mapper;
    private final SyVendorRepository repository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<SyVendorDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<SyVendorDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public SyVendorDto getById(String id) {
        SyVendorDto dto = mapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public SyVendor create(SyVendor body) {
        body.setVendorId("VD" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        return repository.save(body);
    }

    @Transactional
    public SyVendorDto update(String id, SyVendor body) {
        SyVendor entity = repository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "vendorId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        repository.save(entity);
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        SyVendor entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        repository.delete(entity);
        em.flush();
        if (repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<SyVendor> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyVendor row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setVendorId("VD" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                repository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getVendorId(), "vendorId must not be null");
                SyVendor entity = repository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "vendorId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                repository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getVendorId(), "vendorId must not be null");
                if (repository.existsById(id)) repository.deleteById(id);
            }
        }
        em.flush();
    }
}
