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
    private final SyVendorMapper syVendorMapper;
    private final SyVendorRepository syVendorRepository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<SyVendorDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return syVendorMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<SyVendorDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(syVendorMapper.selectPageList(p), syVendorMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public SyVendorDto getById(String id) {
        SyVendorDto dto = syVendorMapper.selectById(id);
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
        return syVendorRepository.save(body);
    }

    @Transactional
    public SyVendorDto update(String id, SyVendor body) {
        SyVendor entity = syVendorRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "vendorId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        syVendorRepository.save(entity);
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        SyVendor entity = syVendorRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syVendorRepository.delete(entity);
        em.flush();
        if (syVendorRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<SyVendor> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getVendorId() != null)
            .map(SyVendor::getVendorId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syVendorRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        List<SyVendor> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getVendorId() != null)
            .toList();
        for (SyVendor row : updateRows) {
            SyVendor entity = syVendorRepository.findById(row.getVendorId())
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + row.getVendorId()));
            VoUtil.voCopyExclude(row, entity, "vendorId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syVendorRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        List<SyVendor> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyVendor row : insertRows) {
            row.setVendorId("VD" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syVendorRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}